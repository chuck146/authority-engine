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

describe('GET /api/v1/reviews/requests', () => {
  it('returns list of review requests', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: [
        {
          id: 'rr-1',
          customer_name: 'John Smith',
          customer_phone: '+12015551234',
          customer_email: null,
          channel: 'sms',
          review_url: 'https://g.page/review',
          status: 'pending',
          sent_at: null,
          created_at: '2026-03-05T12:00:00Z',
        },
      ],
      error: null,
    })

    const req = new NextRequest('http://localhost/api/v1/reviews/requests')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].customerName).toBe('John Smith')
    expect(json[0].channel).toBe('sms')
    expect(json[0].status).toBe('pending')
  })

  it('filters by status query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews/requests?status=sent')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'sent')
  })

  it('filters by channel query param', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews/requests?channel=sms')
    await GET(req)

    expect(mockSupabase.eq).toHaveBeenCalledWith('channel', 'sms')
  })

  it('returns empty array when no requests', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const req = new NextRequest('http://localhost/api/v1/reviews/requests')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new NextRequest('http://localhost/api/v1/reviews/requests')
    const res = await GET(req)

    expect(res.status).toBe(401)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: null,
      error: { message: 'DB error', code: '500' },
    })

    const req = new NextRequest('http://localhost/api/v1/reviews/requests')
    const res = await GET(req)

    expect(res.status).toBe(500)
  })
})

describe('POST /api/v1/reviews/requests', () => {
  function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/v1/reviews/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('creates a review request', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'rr-new' },
      error: null,
    })

    const res = await POST(
      makeRequest({
        customerName: 'John Smith',
        customerPhone: '+12015551234',
        channel: 'sms',
        reviewPlatform: 'google',
        reviewUrl: 'https://g.page/review',
      }),
    )

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('rr-new')
    expect(json.status).toBe('pending')
  })

  it('returns 400 for invalid phone number', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        customerName: 'John',
        customerPhone: 'abc',
        channel: 'sms',
        reviewPlatform: 'google',
        reviewUrl: 'https://g.page/review',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid review platform', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        customerName: 'John',
        customerPhone: '+12015551234',
        channel: 'sms',
        reviewPlatform: 'tiktok',
        reviewUrl: 'https://g.page/review',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for missing customer name', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        customerPhone: '+12015551234',
        channel: 'sms',
        reviewPlatform: 'google',
        reviewUrl: 'https://g.page/review',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid review URL', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)

    const res = await POST(
      makeRequest({
        customerName: 'John',
        customerPhone: '+12015551234',
        channel: 'sms',
        reviewPlatform: 'google',
        reviewUrl: 'not-a-url',
      }),
    )

    expect(res.status).toBe(400)
  })

  it('stores custom message in metadata', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'rr-msg' },
      error: null,
    })

    await POST(
      makeRequest({
        customerName: 'John',
        customerPhone: '+12015551234',
        channel: 'sms',
        reviewPlatform: 'google',
        reviewUrl: 'https://g.page/review',
        message: 'Custom msg',
      }),
    )

    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { customMessage: 'Custom msg' },
      }),
    )
  })

  it('returns 401 when not editor', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Forbidden', 403))

    const res = await POST(
      makeRequest({
        customerName: 'John',
        customerPhone: '+12015551234',
        channel: 'sms',
        reviewPlatform: 'google',
        reviewUrl: 'https://g.page/review',
      }),
    )

    expect(res.status).toBe(403)
  })
})
