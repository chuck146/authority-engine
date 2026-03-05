import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext, buildReviewResponseContent } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockGenerateReviewResponse = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/ai/review-response-generator', () => ({
  generateReviewResponse: (...args: unknown[]) => mockGenerateReviewResponse(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()
const defaultResponseContent = buildReviewResponseContent()

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/v1/reviews/r-1/generate-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function setupHappyPath() {
  mockRequireApiRole.mockResolvedValue(defaultAuth)
  mockGenerateReviewResponse.mockResolvedValue(defaultResponseContent)

  mockSupabase.single
    .mockResolvedValueOnce({
      data: {
        id: 'r-1',
        reviewer_name: 'John Smith',
        rating: 5,
        review_text: 'Great work!',
        platform: 'google',
        response_status: 'pending',
      },
      error: null,
    })
    .mockResolvedValueOnce({
      data: {
        name: 'Cleanest Painting LLC',
        domain: 'cleanestpainting.com',
        branding: { primary: '#1a472a', secondary: '#fbbf24', accent: '#1e3a5f' },
        settings: { service_area_states: ['NJ'], service_area_counties: ['Union'] },
      },
      error: null,
    })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.update.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('POST /api/v1/reviews/[id]/generate-response', () => {
  it('generates an AI response draft', async () => {
    setupHappyPath()

    const res = await POST(makeRequest({ tone: 'appreciative' }), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseText).toBe(defaultResponseContent.response_text)
    expect(json.responseStatus).toBe('review')
    expect(json.sentiment).toBe('positive')
    expect(json.keyThemes).toEqual(defaultResponseContent.key_themes)
  })

  it('passes review context to AI generator', async () => {
    setupHappyPath()

    await POST(makeRequest({ tone: 'professional' }), makeParams('r-1'))

    expect(mockGenerateReviewResponse).toHaveBeenCalledOnce()
    const [, reviewCtx] = mockGenerateReviewResponse.mock.calls[0]!
    expect(reviewCtx.reviewerName).toBe('John Smith')
    expect(reviewCtx.rating).toBe(5)
  })

  it('returns 422 when review already has a non-pending/draft response', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'r-1',
        reviewer_name: 'John',
        rating: 5,
        review_text: 'Great',
        platform: 'google',
        response_status: 'approved',
      },
      error: null,
    })

    const res = await POST(makeRequest({ tone: 'professional' }), makeParams('r-1'))

    expect(res.status).toBe(422)
  })

  it('returns 404 when review not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    })

    const res = await POST(makeRequest({ tone: 'professional' }), makeParams('missing'))

    expect(res.status).toBe(404)
  })

  it('returns 404 when organization not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single
      .mockResolvedValueOnce({
        data: {
          id: 'r-1',
          reviewer_name: 'John',
          rating: 5,
          review_text: 'Great',
          platform: 'google',
          response_status: 'pending',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: null,
      })

    const res = await POST(makeRequest({ tone: 'professional' }), makeParams('r-1'))

    expect(res.status).toBe(404)
  })

  it('returns 500 when AI generation fails', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockGenerateReviewResponse.mockRejectedValue(new Error('Claude API down'))
    mockSupabase.single
      .mockResolvedValueOnce({
        data: {
          id: 'r-1',
          reviewer_name: 'John',
          rating: 5,
          review_text: 'Great',
          platform: 'google',
          response_status: 'pending',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { name: 'Org', domain: null, branding: null, settings: null },
        error: null,
      })

    const res = await POST(makeRequest({ tone: 'professional' }), makeParams('r-1'))

    expect(res.status).toBe(500)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await POST(makeRequest({ tone: 'professional' }), makeParams('r-1'))

    expect(res.status).toBe(401)
  })
})
