import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const { GET } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

type ContentRow = {
  id: string
  title: string
  slug: string
  status: string
  seo_score: number | null
  published_at: string | null
}

function makeRow(
  id: string,
  title: string,
  status: string,
  seoScore: number | null = null,
  publishedAt: string | null = null,
): ContentRow {
  return {
    id,
    title,
    slug: title.toLowerCase().replace(/\s/g, '-'),
    status,
    seo_score: seoScore,
    published_at: publishedAt,
  }
}

function rewireChain() {
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.gte.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  mockSupabase.limit.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  rewireChain()
})

// --- Tests ---

describe('GET /api/v1/dashboard', () => {
  it('returns 200 with complete metrics', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    // 3 content tables + 1 calendar query (Promise.all)
    mockSupabase.returns
      .mockResolvedValueOnce({
        data: [
          makeRow('sp-1', 'Interior Painting', 'published', 80, '2026-03-01T12:00:00Z'),
          makeRow('sp-2', 'Exterior Painting', 'review', null, null),
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [makeRow('lp-1', 'Summit NJ', 'published', 70, '2026-02-28T12:00:00Z')],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [makeRow('bp-1', 'Color Tips', 'draft', null, null)],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ scheduled_at: '2026-04-01T10:00:00Z' }],
        error: null,
      })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()

    // Hero
    expect(json.hero.totalPublished).toBe(2)
    expect(json.hero.averageSeoScore).toBe(75) // (80+70)/2
    expect(json.hero.contentInReview).toBe(1)
    expect(json.hero.nextScheduledPublish).toBe('2026-04-01T10:00:00Z')

    // Pipeline
    expect(json.pipeline.totalContent).toBe(4)
    expect(json.pipeline.statusBreakdown.published).toBe(2)
    expect(json.pipeline.statusBreakdown.review).toBe(1)
    expect(json.pipeline.statusBreakdown.draft).toBe(1)
    expect(json.pipeline.byType).toHaveLength(3)

    // Recent activity
    expect(json.recentActivity).toHaveLength(2)
  })

  it('returns empty metrics when no content exists', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.hero.totalPublished).toBe(0)
    expect(json.hero.averageSeoScore).toBe(0)
    expect(json.hero.contentInReview).toBe(0)
    expect(json.hero.nextScheduledPublish).toBeNull()
    expect(json.pipeline.totalContent).toBe(0)
    expect(json.recentActivity).toHaveLength(0)
  })

  it('computes avg SEO score from published pages only', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({
        data: [
          makeRow('sp-1', 'Page A', 'published', 90, '2026-03-01T12:00:00Z'),
          makeRow('sp-2', 'Page B', 'draft', 20, null), // draft — should NOT count
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    expect(json.hero.averageSeoScore).toBe(90) // only the published page
  })

  it('returns nextScheduledPublish as null when no calendar entries', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    expect(json.hero.nextScheduledPublish).toBeNull()
  })

  it('sorts recent activity by published_at desc', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({
        data: [
          makeRow('sp-1', 'Older', 'published', 70, '2026-01-01T00:00:00Z'),
          makeRow('sp-2', 'Newer', 'published', 80, '2026-03-01T00:00:00Z'),
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    expect(json.recentActivity[0].title).toBe('Newer')
    expect(json.recentActivity[1].title).toBe('Older')
  })

  it('limits recent activity to 8 items', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    const rows = Array.from({ length: 12 }, (_, i) =>
      makeRow(`sp-${i}`, `Page ${i}`, 'published', 70, `2026-03-0${String(i + 1).padStart(2, '0')}T00:00:00Z`),
    )

    mockSupabase.returns
      .mockResolvedValueOnce({ data: rows, error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    expect(json.recentActivity).toHaveLength(8)
  })

  it('populates byType breakdown correctly', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({
        data: [
          makeRow('sp-1', 'Service A', 'published', 80, '2026-03-01T12:00:00Z'),
          makeRow('sp-2', 'Service B', 'draft', null, null),
        ],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [makeRow('lp-1', 'Location A', 'published', 70, '2026-02-28T12:00:00Z')],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    const serviceType = json.pipeline.byType.find(
      (t: { contentType: string }) => t.contentType === 'service_page',
    )
    expect(serviceType.total).toBe(2)
    expect(serviceType.published).toBe(1)

    const locationType = json.pipeline.byType.find(
      (t: { contentType: string }) => t.contentType === 'location_page',
    )
    expect(locationType.total).toBe(1)
    expect(locationType.published).toBe(1)

    const blogType = json.pipeline.byType.find(
      (t: { contentType: string }) => t.contentType === 'blog_post',
    )
    expect(blogType.total).toBe(0)
    expect(blogType.published).toBe(0)
  })

  it('excludes published items without published_at from recent activity', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({
        data: [
          makeRow('sp-1', 'Has Date', 'published', 80, '2026-03-01T12:00:00Z'),
          makeRow('sp-2', 'No Date', 'published', 70, null),
        ],
        error: null,
      })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    // Both are published, but only one has published_at
    expect(json.hero.totalPublished).toBe(2)
    expect(json.recentActivity).toHaveLength(1)
    expect(json.recentActivity[0].title).toBe('Has Date')
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns 500 on unexpected error', async () => {
    mockRequireApiAuth.mockRejectedValue(new Error('DB down'))

    const res = await GET()

    expect(res.status).toBe(500)
  })

  it('handles null data gracefully from supabase', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: null })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.hero.totalPublished).toBe(0)
    expect(json.pipeline.totalContent).toBe(0)
    expect(json.recentActivity).toHaveLength(0)
  })
})
