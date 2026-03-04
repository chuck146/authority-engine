import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

// Build a fresh chainable mock for each test
function buildMockSupabase() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const m of ['from', 'select', 'eq', 'delete', 'maybeSingle']) {
    chain[m] = vi.fn().mockReturnValue(chain)
  }
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })
  return chain
}

let mockSupabase = buildMockSupabase()

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiRole: vi.fn().mockResolvedValue(mockAuth),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockSupabase),
}))

vi.mock('@/lib/google/token-manager', () => ({
  decrypt: vi.fn().mockReturnValue('ya29.decrypted'),
}))

vi.mock('@/lib/google/oauth', () => ({
  revokeToken: vi.fn().mockResolvedValue(undefined),
}))

describe('POST /api/v1/integrations/google/disconnect', () => {
  beforeEach(() => {
    mockSupabase = buildMockSupabase()
  })

  it('disconnects and returns success', async () => {
    // First chain (select): returns a connection
    const selectChain = buildMockSupabase()
    selectChain.maybeSingle!.mockResolvedValueOnce({
      data: { id: 'conn-1', access_token: 'encrypted-token' },
      error: null,
    })

    // Second chain (delete): returns success
    const deleteChain = buildMockSupabase()

    let callCount = 0
    mockSupabase.from!.mockImplementation(() => {
      callCount++
      return callCount === 1 ? selectChain : deleteChain
    })

    const { POST } = await import('../route')
    const res = await POST()
    const json = await res.json()

    expect(json.success).toBe(true)
  })

  it('returns 404 when no connection found', async () => {
    mockSupabase.maybeSingle!.mockResolvedValueOnce({ data: null, error: null })

    const { POST } = await import('../route')
    const res = await POST()
    expect(res.status).toBe(404)
  })

  it('returns 403 for non-admin users', async () => {
    const { AuthError, requireApiRole } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiRole).mockRejectedValueOnce(new AuthError('Insufficient permissions', 403))

    const { POST } = await import('../route')
    const res = await POST()
    expect(res.status).toBe(403)
  })
})
