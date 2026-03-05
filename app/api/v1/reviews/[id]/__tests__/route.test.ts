import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiAuth(...args),
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

const { GET, PUT } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

const defaultReviewRow = {
  id: 'r-1',
  platform: 'google',
  external_id: null,
  reviewer_name: 'John Smith',
  reviewer_profile_url: null,
  rating: 5,
  review_text: 'Great work!',
  review_date: '2026-03-01T12:00:00Z',
  response_text: null,
  response_status: 'pending',
  response_generated_at: null,
  response_approved_by: null,
  response_approved_at: null,
  response_sent_at: null,
  sentiment: null,
  sentiment_score: null,
  metadata: {},
  created_at: '2026-03-01T12:00:00Z',
  updated_at: '2026-03-01T12:00:00Z',
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

describe('GET /api/v1/reviews/[id]', () => {
  it('returns review detail', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: defaultReviewRow,
      error: null,
    })

    const res = await GET(new Request('http://localhost/api/v1/reviews/r-1'), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('r-1')
    expect(json.reviewerName).toBe('John Smith')
    expect(json.platform).toBe('google')
    expect(json.responseStatus).toBe('pending')
  })

  it('returns 404 when review not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    })

    const res = await GET(
      new Request('http://localhost/api/v1/reviews/missing'),
      makeParams('missing'),
    )

    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await GET(new Request('http://localhost/api/v1/reviews/r-1'), makeParams('r-1'))

    expect(res.status).toBe(401)
  })
})

describe('PUT /api/v1/reviews/[id]', () => {
  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/v1/reviews/r-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('edits response text', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'r-1', response_status: 'draft' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { ...defaultReviewRow, response_text: 'Updated response', response_status: 'draft' },
        error: null,
      })

    const res = await PUT(makeRequest({ responseText: 'Updated response' }), makeParams('r-1'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.responseText).toBe('Updated response')
  })

  it('returns 422 when response is not editable', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'r-1', response_status: 'sent' },
      error: null,
    })

    const res = await PUT(makeRequest({ responseText: 'Updated response' }), makeParams('r-1'))

    expect(res.status).toBe(422)
  })

  it('returns 404 when review not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    })

    const res = await PUT(makeRequest({ responseText: 'Updated' }), makeParams('missing'))

    expect(res.status).toBe(404)
  })

  it('returns 400 for empty body', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await PUT(makeRequest({}), makeParams('r-1'))

    expect(res.status).toBe(400)
  })
})
