import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildStructuredContent } from '@/tests/factories'
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

// Mock the SEO scoring to return deterministic values
vi.mock('@/lib/seo', () => ({
  calculateSeoScore: vi.fn(() => ({
    score: 65,
    rules: [
      { id: 'meta-title-length', label: 'Meta Title Length', category: 'meta-tags', score: 100, weight: 15, passed: true, recommendation: null },
      { id: 'content-length', label: 'Content Length', category: 'content-structure', score: 30, weight: 15, passed: false, recommendation: 'Content is too short.' },
    ],
    categoryScores: { 'meta-tags': 100, 'content-structure': 30, 'keyword-optimization': 50, readability: 80 },
    summary: 'Good foundation.',
  })),
  calculateSeoScoreValue: vi.fn(() => 65),
}))

const { GET } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()
const defaultContent = buildStructuredContent()

function makeRow(id: string, title: string, seoScore: number | null) {
  return {
    id,
    title,
    slug: title.toLowerCase().replace(/\s/g, '-'),
    status: 'published',
    seo_score: seoScore,
    keywords: ['painting'],
    content: defaultContent,
  }
}

function rewireChain() {
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.update.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
}

// --- Setup ---

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  rewireChain()
})

// --- Tests ---

describe('GET /api/v1/seo', () => {
  it('returns 200 with overview data', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    // 3 table fetches — one per content type
    mockSupabase.returns
      .mockResolvedValueOnce({ data: [makeRow('sp-1', 'Interior Painting', 80)], error: null })
      .mockResolvedValueOnce({ data: [makeRow('lp-1', 'Summit NJ Painting', 60)], error: null })
      .mockResolvedValueOnce({ data: [makeRow('bp-1', 'Color Tips', 45)], error: null })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.averageScore).toBe(62) // (80 + 60 + 45) / 3 = 61.67 → 62
    expect(json.totalPages).toBe(3)
    expect(json.scoreDistribution).toEqual({
      excellent: 1,
      good: 1,
      needsWork: 1,
      poor: 0,
    })
    expect(json.contentByType).toHaveLength(3)
    expect(json.recentScores).toHaveLength(3)
  })

  it('backfills seo_score for null rows', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: [makeRow('sp-1', 'Page', null)], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    // Backfilled with calculateSeoScoreValue mock = 65
    expect(json.averageScore).toBe(65)
  })

  it('returns empty overview when no content exists', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.averageScore).toBe(0)
    expect(json.totalPages).toBe(0)
    expect(json.recentScores).toHaveLength(0)
  })

  it('sorts recentScores worst-first', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: [
        makeRow('sp-1', 'High Score', 90),
        makeRow('sp-2', 'Low Score', 20),
      ], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    expect(json.recentScores[0].seoScore).toBe(20)
    expect(json.recentScores[1].seoScore).toBe(90)
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

  it('includes topIssue from worst failing rule', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)

    mockSupabase.returns
      .mockResolvedValueOnce({ data: [makeRow('sp-1', 'Test Page', 50)], error: null })
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()
    const json = await res.json()

    // From the calculateSeoScore mock, worst failing rule is content-length with recommendation
    expect(json.recentScores[0].topIssue).toBe('Content is too short.')
  })
})
