import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()
const mockGetValidToken = vi.fn()
const mockReplyToReview = vi.fn()

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

vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: (...args: unknown[]) => mockGetValidToken(...args),
}))

vi.mock('@/lib/google/business-profile', () => ({
  replyToReview: (...args: unknown[]) => mockReplyToReview(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext({ role: 'admin' })

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
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

describe('POST /api/v1/reviews/[id]/post-reply', () => {
  it('posts reply and transitions to sent status', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'review-123',
        platform: 'google',
        external_id: 'ext-abc',
        response_text: 'Thank you for your review!',
        response_status: 'approved',
        metadata: { gbp_review_name: 'accounts/123/locations/456/reviews/789' },
        organization_id: defaultAuth.organizationId,
      },
      error: null,
    })
    mockGetValidToken.mockResolvedValue({ accessToken: 'token-xyz' })
    mockReplyToReview.mockResolvedValue(undefined)

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('review-123'))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.id).toBe('review-123')
    expect(json.responseStatus).toBe('sent')

    expect(mockGetValidToken).toHaveBeenCalledWith(defaultAuth.organizationId, 'business_profile')
    expect(mockReplyToReview).toHaveBeenCalledWith({
      accessToken: 'token-xyz',
      reviewName: 'accounts/123/locations/456/reviews/789',
      comment: 'Thank you for your review!',
    })
  })

  it('returns 404 when review not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    })

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('missing-id'))

    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toBe('Review not found')
  })

  it('returns 422 when platform is not google', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'review-123',
        platform: 'yelp',
        external_id: 'ext-abc',
        response_text: 'Thank you!',
        response_status: 'approved',
        metadata: {},
        organization_id: defaultAuth.organizationId,
      },
      error: null,
    })

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('review-123'))

    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toBe('Post reply is only available for Google reviews')
  })

  it('returns 422 when response not approved', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'review-123',
        platform: 'google',
        external_id: 'ext-abc',
        response_text: 'Thank you!',
        response_status: 'draft',
        metadata: { gbp_review_name: 'accounts/123/locations/456/reviews/789' },
        organization_id: defaultAuth.organizationId,
      },
      error: null,
    })

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('review-123'))

    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toBe('Response must be approved before posting')
  })

  it('returns 422 when no gbp_review_name in metadata', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'review-123',
        platform: 'google',
        external_id: 'ext-abc',
        response_text: 'Thank you!',
        response_status: 'approved',
        metadata: {},
        organization_id: defaultAuth.organizationId,
      },
      error: null,
    })

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('review-123'))

    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.error).toBe('Review is missing GBP metadata. It may have been manually created.')
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('review-123'))

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 for non-admin users', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

    const request = new Request('http://localhost')
    const res = await POST(request, makeParams('review-123'))

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Insufficient permissions')
  })
})
