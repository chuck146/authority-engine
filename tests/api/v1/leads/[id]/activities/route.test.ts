import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockRequireApiRole = vi.fn()
vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return { ...actual, requireApiRole: mockRequireApiRole }
})

const mockSupabase = createMockSupabaseClient()
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}))

const context = { params: Promise.resolve({ id: 'lead-1' }) }

describe('POST /api/v1/leads/[id]/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiRole.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
  })

  async function callPost(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/v1/leads/[id]/activities/route')
    const request = new Request('http://localhost/api/v1/leads/lead-1/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return POST(request, context)
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callPost({ activityType: 'note', description: 'test' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid body', async () => {
    const res = await callPost({ description: 'missing type' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when lead not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })
    const res = await callPost({ activityType: 'note', description: 'Called customer' })
    expect(res.status).toBe(404)
  })

  it('returns 201 on success', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null })
    const res = await callPost({ activityType: 'note', description: 'Called customer' })
    expect(res.status).toBe(201)
  })

  it('inserts activity with correct data', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'lead-1' }, error: null })
    await callPost({ activityType: 'phone_call', description: 'Discussed project scope' })
    const fromCalls = mockSupabase.from.mock.calls.map((c: unknown[]) => c[0])
    expect(fromCalls).toContain('lead_activities')
    expect(mockSupabase.insert).toHaveBeenCalled()
  })
})
