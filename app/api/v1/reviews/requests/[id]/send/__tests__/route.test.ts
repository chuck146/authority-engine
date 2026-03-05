import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockSupabase = createMockSupabaseClient()
const mockEnqueueSmsJob = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiAuth: (...args: unknown[]) => mockRequireApiRole(...args),
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock('@/lib/queue/sms-scheduler', () => ({
  enqueueSmsJob: (...args: unknown[]) => mockEnqueueSmsJob(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext()

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mockSupabase.from.mockReturnValue(mockSupabase)
  mockSupabase.select.mockReturnValue(mockSupabase)
  mockSupabase.eq.mockReturnValue(mockSupabase)
})

describe('POST /api/v1/reviews/requests/[id]/send', () => {
  const params = Promise.resolve({ id: 'rr-1' })

  it('enqueues SMS job for pending request', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'rr-1', status: 'pending', customer_phone: '+12015551234' },
      error: null,
    })
    mockEnqueueSmsJob.mockResolvedValueOnce('job-1')

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1/send', {
      method: 'POST',
    })
    const res = await POST(req, { params })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.jobId).toBe('job-1')
    expect(json.status).toBe('queued')
    expect(mockEnqueueSmsJob).toHaveBeenCalledWith('rr-1', defaultAuth.organizationId)
  })

  it('allows resending failed requests', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'rr-1', status: 'failed', customer_phone: '+12015551234' },
      error: null,
    })
    mockEnqueueSmsJob.mockResolvedValueOnce('job-2')

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1/send', {
      method: 'POST',
    })
    const res = await POST(req, { params })

    expect(res.status).toBe(200)
  })

  it('returns 400 for already sent request', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'rr-1', status: 'sent', customer_phone: '+12015551234' },
      error: null,
    })

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1/send', {
      method: 'POST',
    })
    const res = await POST(req, { params })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('sent')
  })

  it('returns 400 when no phone number', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'rr-1', status: 'pending', customer_phone: null },
      error: null,
    })

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1/send', {
      method: 'POST',
    })
    const res = await POST(req, { params })

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('phone')
  })

  it('returns 404 when request not found', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    })

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-999/send', {
      method: 'POST',
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'rr-999' }) })

    expect(res.status).toBe(404)
  })

  it('returns 403 when not editor', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Forbidden', 403))

    const req = new Request('http://localhost/api/v1/reviews/requests/rr-1/send', {
      method: 'POST',
    })
    const res = await POST(req, { params })

    expect(res.status).toBe(403)
  })
})
