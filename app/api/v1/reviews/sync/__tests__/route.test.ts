import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'

// --- Mocks ---

const mockRequireApiRole = vi.fn()
const mockEnqueueGbpSync = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/queue/gbp-scheduler', () => ({
  enqueueGbpSync: (...args: unknown[]) => mockEnqueueGbpSync(...args),
}))

const { POST } = await import('../route')
const { AuthError } = await import('@/lib/auth/api-guard')

const defaultAuth = buildAuthContext({ role: 'admin' })

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/v1/reviews/sync', () => {
  it('triggers sync and returns job ID', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockEnqueueGbpSync.mockResolvedValue('job-abc-123')

    const res = await POST()

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.jobId).toBe('job-abc-123')
    expect(mockRequireApiRole).toHaveBeenCalledWith('admin')
    expect(mockEnqueueGbpSync).toHaveBeenCalledWith(defaultAuth.organizationId)
  })

  it('returns 401 when not authenticated', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Unauthorized', 401))

    const res = await POST()

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 403 for non-admin users', async () => {
    mockRequireApiRole.mockRejectedValue(new AuthError('Insufficient permissions', 403))

    const res = await POST()

    expect(res.status).toBe(403)
    const json = await res.json()
    expect(json.error).toBe('Insufficient permissions')
  })

  it('returns 500 when enqueue fails', async () => {
    mockRequireApiRole.mockResolvedValue(defaultAuth)
    mockEnqueueGbpSync.mockRejectedValue(new Error('Redis timeout'))

    const res = await POST()

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Failed to trigger review sync')
  })
})
