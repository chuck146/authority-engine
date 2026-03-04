import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

function buildMockSupabase() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  for (const m of ['from', 'select', 'eq', 'update', 'maybeSingle']) {
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

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/v1/integrations/ga4/select-property', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/integrations/ga4/select-property', () => {
  beforeEach(() => {
    mockSupabase = buildMockSupabase()
  })

  it('updates property and returns success', async () => {
    // First chain: select finds active connection
    const selectChain = buildMockSupabase()
    selectChain.maybeSingle!.mockResolvedValueOnce({
      data: { id: 'conn-1' },
      error: null,
    })

    // Second chain: update succeeds
    const updateChain = buildMockSupabase()
    updateChain.eq!.mockResolvedValueOnce({ data: null, error: null })

    let callCount = 0
    mockSupabase.from!.mockImplementation(() => {
      callCount++
      return callCount === 1 ? selectChain : updateChain
    })

    const { POST } = await import('../route')
    const res = await POST(makeRequest({ propertyId: 'properties/123456' }))
    const json = await res.json()

    expect(json.success).toBe(true)
    expect(json.propertyId).toBe('properties/123456')
  })

  it('returns 400 for invalid body', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({ propertyId: '' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing propertyId', async () => {
    const { POST } = await import('../route')
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 404 when no active connection', async () => {
    mockSupabase.maybeSingle!.mockResolvedValueOnce({ data: null, error: null })

    const { POST } = await import('../route')
    const res = await POST(makeRequest({ propertyId: 'properties/123' }))
    expect(res.status).toBe(404)
  })

  it('returns 403 for non-admin users', async () => {
    const { AuthError, requireApiRole } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiRole).mockRejectedValueOnce(new AuthError('Insufficient permissions', 403))

    const { POST } = await import('../route')
    const res = await POST(makeRequest({ propertyId: 'properties/123' }))
    expect(res.status).toBe(403)
  })
})
