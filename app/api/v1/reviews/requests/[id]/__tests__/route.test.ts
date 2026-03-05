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
    requireApiRole: (...args: unknown[]) => mockRequireApiAuth(...args),
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
})

describe('GET /api/v1/reviews/requests/[id]', () => {
  const params = Promise.resolve({ id: 'rr-1' })

  it('returns review request detail', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'rr-1',
        customer_name: 'John Smith',
        customer_phone: '+12015551234',
        customer_email: null,
        channel: 'sms',
        review_url: 'https://g.page/review',
        status: 'sent',
        sent_at: '2026-03-05T13:00:00Z',
        delivered_at: null,
        completed_at: null,
        review_id: null,
        error_message: null,
        metadata: {},
        created_by: 'user-123',
        created_at: '2026-03-05T12:00:00Z',
        updated_at: '2026-03-05T13:00:00Z',
      },
      error: null,
    })

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1')
    const res = await GET(req, { params })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.id).toBe('rr-1')
    expect(json.customerName).toBe('John Smith')
    expect(json.status).toBe('sent')
    expect(json.sentAt).toBe('2026-03-05T13:00:00Z')
  })

  it('returns 404 when not found', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    })

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-999')
    const res = await GET(req, { params: Promise.resolve({ id: 'rr-999' }) })

    expect(res.status).toBe(404)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiAuth.mockRejectedValue(new AuthError('Unauthorized', 401))

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1')
    const res = await GET(req, { params })

    expect(res.status).toBe(401)
  })

  it('returns 500 on database error', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: '500', message: 'DB error' },
    })

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1')
    const res = await GET(req, { params })

    expect(res.status).toBe(500)
  })
})
