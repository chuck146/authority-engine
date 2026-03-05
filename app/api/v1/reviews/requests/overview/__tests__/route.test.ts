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
  mockSupabase.returns.mockReturnValue(mockSupabase)
})

describe('GET /api/v1/reviews/requests/overview', () => {
  it('returns aggregated overview', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({
      data: [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'sent' },
        { status: 'delivered' },
        { status: 'completed' },
        { status: 'failed' },
      ],
      error: null,
    })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(8)
    expect(json.pending).toBe(2)
    expect(json.sent).toBe(3)
    expect(json.delivered).toBe(1)
    expect(json.completed).toBe(1)
    expect(json.failed).toBe(1)
  })

  it('returns zeros when no requests', async () => {
    mockRequireApiAuth.mockResolvedValue(defaultAuth)
    mockSupabase.returns.mockResolvedValueOnce({ data: [], error: null })

    const res = await GET()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.total).toBe(0)
    expect(json.pending).toBe(0)
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
      error: { message: 'DB error', code: '500' },
    })

    const res = await GET()

    expect(res.status).toBe(500)
  })
})
