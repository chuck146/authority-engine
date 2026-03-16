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

const mockSend = vi.fn()
const mockGetStatus = vi.fn()
vi.mock('@/lib/sms/salesmessage', () => ({
  createSmsAdapter: vi.fn(() => ({ send: mockSend, getStatus: mockGetStatus })),
}))

const context = { params: Promise.resolve({ id: 'lead-1' }) }

describe('POST /api/v1/leads/[id]/send-sms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiRole.mockResolvedValue({
      userId: 'user-123',
      organizationId: 'org-456',
      role: 'editor',
    })
    mockGetStatus.mockReturnValue({ isConfigured: true })
    mockSend.mockResolvedValue({ success: true, messageId: 'msg-123' })
  })

  async function callPost(body: Record<string, unknown>) {
    const { POST } = await import('@/app/api/v1/leads/[id]/send-sms/route')
    const request = new Request('http://localhost/api/v1/leads/lead-1/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return POST(request, context)
  }

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Unauthorized', 401))
    const res = await callPost({ message: 'Hi' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for missing message', async () => {
    const res = await callPost({})
    expect(res.status).toBe(400)
  })

  it('returns 404 when lead not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })
    const res = await callPost({ message: 'Hello' })
    expect(res.status).toBe(404)
  })

  it('returns 503 when SMS not configured', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'lead-1', phone: '+12015551234', name: 'Jane Doe' },
      error: null,
    })
    mockGetStatus.mockReturnValueOnce({ isConfigured: false })
    const res = await callPost({ message: 'Hello' })
    expect(res.status).toBe(503)
  })

  it('returns 200 on success', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'lead-1', phone: '+12015551234', name: 'Jane Doe' },
      error: null,
    })
    const res = await callPost({ message: 'Hi Jane, following up on your estimate request.' })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.messageId).toBe('msg-123')
  })
})
