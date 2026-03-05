import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
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

const { GET, POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.insert.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('GET /api/v1/reviews', () => {
  it('returns list of reviews', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: [
        {
          id: 'r-1',
          platform: 'google',
          reviewer_name: 'John Smith',
          rating: 5,
          review_text: 'Great work!',
          review_date: '2026-03-01T12:00:00Z',
          response_status: 'pending',
          sentiment: null,
          created_at: '2026-03-01T12:00:00Z',
        },
        {
          id: 'r-2',
          platform: 'yelp',
          reviewer_name: 'Jane Doe',
          rating: 4,
          review_text: 'Good service',
          review_date: '2026-03-02T12:00:00Z',
          response_status: 'review',
          sentiment: 'positive',
          created_at: '2026-03-02T12:00:00Z',
        },
      ],
      error: null,
    })

    const req = new NextRequest('http://localhost/api/v1/reviews')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(2)
    expect(json[0].platform).toBe('google')
    expect(json[0].reviewerName).toBe('John Smith')
    expect(json[1].platform).toBe('yelp')
  })

  it('filters by platform query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews?platform=google')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('platform', 'google')
  })

  it('filters by rating query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews?rating=5')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('rating', 5)
  })

  it('filters by responseStatus query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews?responseStatus=pending')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('response_status', 'pending')
  })

  it('returns empty array when no reviews', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/v1/reviews')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error', code: '500' },
    })

    const req = new NextRequest('http://localhost/api/v1/reviews')
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})

describe('POST /api/v1/reviews', () => {
  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/v1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('creates a manual review entry', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'review-new' },
      error: null,
    })

    const res = await POST(
      makeRequest({
        platform: 'google',
        reviewerName: 'John Smith',
        rating: 5,
        reviewText: 'Great work!',
        reviewDate: '2026-03-01T12:00:00Z',
      }),
    )

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('review-new')
    expect(json.status).toBe('pending')
  })

  it('returns 400 for invalid platform', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        platform: 'tiktok',
        reviewerName: 'Test',
        rating: 5,
        reviewDate: '2026-03-01T12:00:00Z',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for missing reviewer name', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        platform: 'google',
        rating: 5,
        reviewDate: '2026-03-01T12:00:00Z',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid rating', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        platform: 'google',
        reviewerName: 'Test',
        rating: 6,
        reviewDate: '2026-03-01T12:00:00Z',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await POST(
      makeRequest({
        platform: 'google',
        reviewerName: 'Test',
        rating: 5,
        reviewDate: '2026-03-01T12:00:00Z',
      }),
    )

    expect(res.status).toBe(401)
  })
})
