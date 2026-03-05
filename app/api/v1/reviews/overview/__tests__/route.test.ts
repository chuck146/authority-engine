import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiAuth = vi.fn()
const mockSupabase = createMockSupabaseClient()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
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

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
  mockSupabase.order.mockReturnValue(mockSupabase)
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('GET /api/v1/reviews/overview', () => {
  it('returns overview with correct aggregations', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: [
        {
          id: 'r-1',
          platform: 'google',
          reviewer_name: 'John',
          rating: 5,
          review_text: 'Great!',
          review_date: '2026-03-01T12:00:00Z',
          response_status: 'pending',
          sentiment: 'positive',
          created_at: '2026-03-01T12:00:00Z',
        },
        {
          id: 'r-2',
          platform: 'google',
          reviewer_name: 'Jane',
          rating: 4,
          review_text: 'Good',
          review_date: '2026-03-02T12:00:00Z',
          response_status: 'sent',
          sentiment: 'positive',
          created_at: '2026-03-02T12:00:00Z',
        },
        {
          id: 'r-3',
          platform: 'yelp',
          reviewer_name: 'Bob',
          rating: 2,
          review_text: 'Not great',
          review_date: '2026-03-03T12:00:00Z',
          response_status: 'pending',
          sentiment: 'negative',
          created_at: '2026-03-03T12:00:00Z',
        },
      ],
      error: null,
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totalReviews).toBe(3)
    expect(json.averageRating).toBe(3.7)
    expect(json.pendingResponses).toBe(2)
    expect(json.ratingDistribution[5]).toBe(1)
    expect(json.ratingDistribution[4]).toBe(1)
    expect(json.ratingDistribution[2]).toBe(1)
    expect(json.platformBreakdown).toHaveLength(2)
    expect(json.sentimentBreakdown).toHaveLength(2)
    expect(json.recentReviews).toHaveLength(3)
  })

  it('returns zero averages when no reviews', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.totalReviews).toBe(0)
    expect(json.averageRating).toBe(0)
    expect(json.pendingResponses).toBe(0)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error' },
    })

    const res = await GET()

    expect(res.status).toBe(500)
  })
})
