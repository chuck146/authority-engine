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

const mockSendLeadEmail = vi.fn()
vi.mock('@/lib/email/resend', () => ({
  sendLeadEmail: mockSendLeadEmail,
}))

const context = { params: Promise.resolve({ id: 'lead-1' }) }

describe('POST /api/v1/leads/[id]/send-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiRole.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
    mockSendLeadEmail.mockResolvedValue(undefined)
  })

  async function callPost(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/v1/leads/[id]/send-email/route')
    const request = new Request('http://localhost/api/v1/leads/lead-1/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return POST(request, context)
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callPost({ subject: 'Hi', body: 'Hello' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing subject', async () => {
    const res = await callPost({ body: 'Hello' })
    expect(res.status).toBe(400)
  })

  it('returns 404 when lead not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })
    const res = await callPost({ subject: 'Estimate', body: 'Your estimate details' })
    expect(res.status).toBe(404)
  })

  it('returns 500 when email send fails', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'lead-1', email: 'jane@example.com', name: 'Jane Doe' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { name: 'Cleanest Painting LLC' }, error: null })
    mockSendLeadEmail.mockRejectedValueOnce(new Error('Email failed'))
    const res = await callPost({ subject: 'Estimate', body: 'Details here' })
    expect(res.status).toBe(500)
  })

  it('returns 200 on success', async () => {
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: 'lead-1', email: 'jane@example.com', name: 'Jane Doe' },
        error: null,
      })
      .mockResolvedValueOnce({ data: { name: 'Cleanest Painting LLC' }, error: null })
    const res = await callPost({ subject: 'Estimate', body: 'Your painting estimate is $2,500' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(mockSendLeadEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com', subject: 'Estimate' }),
    )
  })
})
