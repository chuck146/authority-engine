import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildStructuredContent } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const mockCalculateSeoScoreValue = vi.fn().mockReturnValue(75)
vi.mock('@/lib/seo', () => ({
  calculateSeoScoreValue: (...args: unknown[]) => mockCalculateSeoScoreValue(...args),
}))

const { GET, PUT } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

// --- Helpers ---

type RouteParams = { params: Promise<{ type: string; id: string }> }

function makeGetRequest(type: string, id: string): [Request, RouteParams] {
  const request = new Request(`http://localhost/api/v1/content/${type}/${id}`)
  return [request, { params: Promise.resolve({ type, id }) }]
}

function makePutRequest(type: string, id: string, body: unknown): [Request, RouteParams] {
  const request = new Request(`http://localhost/api/v1/content/${type}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return [request, { params: Promise.resolve({ type, id }) }]
}

const defaultAuth = buildAuthContext()
const defaultContent = buildStructuredContent()

const defaultRow = {
  id: 'content-1',
  title: 'Interior Painting',
  slug: 'interior-painting',
  status: 'review',
  content: defaultContent,
  seo_score: null,
  keywords: ['interior painting'],
  meta_title: 'Interior Painting | Cleanest Painting',
  meta_description: 'Professional interior painting in NJ.',
  approved_by: null,
  approved_at: null,
  rejection_note: null,
  published_at: null,
  created_at: '2026-03-01T12:00:00Z',
  updated_at: '2026-03-01T12:00:00Z',
}

function rewireChain() {
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.insert.mockReturnValue(mockSupabase)
  mockSupabase.update.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.neq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
  mockSupabase.single.mockResolvedValue({ data: null, error: null })
  mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null })
}

// --- Setup ---

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  rewireChain()
  mockCalculateSeoScoreValue.mockReturnValue(75)
})

// --- GET Tests ---

describe('GET /api/v1/content/[type]/[id]', () => {
  it('returns 200 with content detail', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: defaultRow, error: null })

    const res = await GET(...makeGetRequest('service_page', 'content-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('content-1')
    expect(json.type).toBe('service_page')
    expect(json.title).toBe('Interior Painting')
    expect(json.metaTitle).toBe('Interior Painting | Cleanest Painting')
  })

  it('returns 400 for invalid content type', async () => {
    const res = await GET(...makeGetRequest('invalid_type', 'content-1'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when content not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

    const res = await GET(...makeGetRequest('service_page', 'nonexistent'))
    expect(res.status).toBe(404)
  })
})

// --- PUT Tests ---

describe('PUT /api/v1/content/[type]/[id]', () => {
  function setupPutHappyPath(currentOverrides?: Record<string, unknown>) {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    // 1st single: fetch current record (includes content, keywords for JSONB meta sync + SEO scoring)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'content-1', status: 'review', slug: 'interior-painting', content: defaultContent, keywords: ['interior painting'], ...currentOverrides },
      error: null,
    })
    // update chain: .update().eq().eq() — await resolves to chain (no error prop = undefined = falsy)
    // 2nd single: refetch after update
    mockSupabase.single.mockResolvedValueOnce({
      data: { ...defaultRow, title: 'Updated Title' },
      error: null,
    })
  }

  describe('happy paths', () => {
    it('returns 200 when updating title only', async () => {
      setupPutHappyPath()

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Updated Title',
      }))

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.title).toBe('Updated Title')
      expect(json.type).toBe('service_page')
    })

    it('returns 200 when updating meta fields and syncs into JSONB content', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'content-1', status: 'draft', slug: 'interior-painting', content: defaultContent, keywords: ['interior painting'] },
          error: null,
        })
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { ...defaultRow, status: 'draft', meta_title: 'New Meta' },
          error: null,
        })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        metaTitle: 'New Meta',
        metaDescription: 'New description for SEO.',
      }))

      expect(res.status).toBe(200)

      // Verify meta fields are merged into JSONB content
      const updateCalls = mockSupabase.update.mock.calls
      expect(updateCalls.length).toBeGreaterThan(0)
      const payload = updateCalls[0]![0] as Record<string, unknown>
      const contentPayload = payload.content as Record<string, unknown>
      expect(contentPayload.meta_title).toBe('New Meta')
      expect(contentPayload.meta_description).toBe('New description for SEO.')
    })

    it('allows editing content in draft status', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'content-1', status: 'draft', slug: 'test', content: defaultContent },
          error: null,
        })
      mockSupabase.single.mockResolvedValueOnce({ data: defaultRow, error: null })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Edited Draft',
      }))

      expect(res.status).toBe(200)
    })

    it('updates slug when changed and no conflict', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'content-1', status: 'review', slug: 'old-slug', content: defaultContent, keywords: ['painting'] },
        error: null,
      })
      // slug uniqueness check — no conflict
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null })
      // refetch
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...defaultRow, slug: 'new-slug' },
        error: null,
      })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        slug: 'new-slug',
      }))

      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.slug).toBe('new-slug')
    })

    it('skips slug uniqueness check when slug unchanged', async () => {
      setupPutHappyPath()

      await PUT(...makePutRequest('service_page', 'content-1', {
        slug: 'interior-painting', // same as current
      }))

      // maybeSingle should NOT have been called (no uniqueness query)
      expect(mockSupabase.maybeSingle).not.toHaveBeenCalled()
    })

    it('recalculates seo_score when content changes', async () => {
      const updatedContent = buildStructuredContent({ headline: 'Updated Content' })
      setupPutHappyPath()

      await PUT(...makePutRequest('service_page', 'content-1', {
        content: updatedContent,
      }))

      expect(mockCalculateSeoScoreValue).toHaveBeenCalled()
      const updateCalls = mockSupabase.update.mock.calls
      const payload = updateCalls[0]![0] as Record<string, unknown>
      expect(payload.seo_score).toBe(75)
    })

    it('recalculates seo_score when keywords change', async () => {
      setupPutHappyPath()

      await PUT(...makePutRequest('service_page', 'content-1', {
        keywords: ['new keyword'],
      }))

      expect(mockCalculateSeoScoreValue).toHaveBeenCalled()
      const updateCalls = mockSupabase.update.mock.calls
      const payload = updateCalls[0]![0] as Record<string, unknown>
      expect(payload.seo_score).toBe(75)
    })

    it('does not recalculate seo_score when only title changes', async () => {
      setupPutHappyPath()

      await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'New Title Only',
      }))

      expect(mockCalculateSeoScoreValue).not.toHaveBeenCalled()
    })

    it('recalculates excerpt and reading_time for blog_post content update', async () => {
      const longContent = buildStructuredContent({
        intro: 'A'.repeat(300),
        sections: [
          { title: 'S1', body: 'word '.repeat(400) },
        ],
      })

      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'blog-1', status: 'review', slug: 'test-blog', content: defaultContent, keywords: [] },
        error: null,
      })
      mockSupabase.single.mockResolvedValueOnce({ data: defaultRow, error: null })

      const res = await PUT(...makePutRequest('blog_post', 'blog-1', {
        content: longContent,
      }))

      expect(res.status).toBe(200)

      // Check the update call included excerpt and reading_time
      const updateCalls = mockSupabase.update.mock.calls
      expect(updateCalls.length).toBeGreaterThan(0)
      const payload = updateCalls[0]![0] as Record<string, unknown>
      expect(payload.excerpt).toHaveLength(200)
      expect(payload.reading_time_minutes).toBeGreaterThanOrEqual(1)
    })
  })

  describe('auth errors', () => {
    it('returns 401 when not authenticated', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(401)
      const json = await res.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('returns 403 for viewer role', async () => {
      mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(403)
      const json = await res.json()
      expect(json.error).toBe('Insufficient permissions')
    })
  })

  describe('validation', () => {
    it('returns 400 for invalid content type', async () => {
      const res = await PUT(...makePutRequest('invalid_type', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for empty body', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await PUT(...makePutRequest('service_page', 'content-1', {}))

      expect(res.status).toBe(400)
      const json = await res.json()
      expect(json.error).toBe('Invalid request')
    })

    it('returns 400 for invalid slug format', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        slug: 'Has Spaces And Caps',
      }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for meta_title exceeding 60 chars', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        metaTitle: 'A'.repeat(61),
      }))

      expect(res.status).toBe(400)
    })

    it('returns 400 for meta_description exceeding 160 chars', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        metaDescription: 'A'.repeat(161),
      }))

      expect(res.status).toBe(400)
    })
  })

  describe('status guards', () => {
    it('returns 422 when editing approved content', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'content-1', status: 'approved', slug: 'test', content: defaultContent, keywords: [] },
        error: null,
      })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(422)
      const json = await res.json()
      expect(json.error).toContain('approved')
      expect(json.error).toContain('Archive it first')
    })

    it('returns 422 when editing published content', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'content-1', status: 'published', slug: 'test', content: defaultContent, keywords: [] },
        error: null,
      })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(422)
    })

    it('returns 422 when editing archived content', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'content-1', status: 'archived', slug: 'test', content: defaultContent, keywords: [] },
        error: null,
      })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(422)
    })
  })

  describe('slug uniqueness', () => {
    it('returns 409 when new slug conflicts', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'content-1', status: 'review', slug: 'old-slug', content: defaultContent, keywords: ['painting'] },
        error: null,
      })
      // slug check returns existing record
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'other-content' },
        error: null,
      })

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        slug: 'taken-slug',
      }))

      expect(res.status).toBe(409)
      const json = await res.json()
      expect(json.error).toContain('slug already exists')
    })
  })

  describe('data errors', () => {
    it('returns 404 when content not found', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const res = await PUT(...makePutRequest('service_page', 'nonexistent', {
        title: 'Test',
      }))

      expect(res.status).toBe(404)
    })

    it('returns 500 for generic Supabase error', async () => {
      mockRequireApiRole.mockResolvedValue(defaultAuth)
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'content-1', status: 'review', slug: 'test', content: defaultContent, keywords: [] },
        error: null,
      })
      // update chain returns error via separate chain object
      const updateChain = {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ error: new Error('DB down') }),
        }),
      }
      mockSupabase.update.mockReturnValueOnce(updateChain)

      const res = await PUT(...makePutRequest('service_page', 'content-1', {
        title: 'Test',
      }))

      expect(res.status).toBe(500)
    })
  })
})
