import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireApiRole = vi.fn()
const mockSyncGa4ForOrg = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    AuthError: actual.AuthError,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/queue/ga4-sync-worker', () => ({
  syncGa4ForOrg: (...args: unknown[]) => mockSyncGa4ForOrg(...args),
}))

describe('POST /api/v1/integrations/ga4/sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns 200 with syncedAt on success', async () => {
    mockRequireApiRole.mockResolvedValueOnce({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    })
    mockSyncGa4ForOrg.mockResolvedValueOnce(undefined)

    const { POST } = await import('@/app/api/v1/integrations/ga4/sync/route')
    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.syncedAt).toBeDefined()
    expect(mockSyncGa4ForOrg).toHaveBeenCalledWith('org-1')
  })

  it('requires admin role', async () => {
    mockRequireApiRole.mockResolvedValueOnce({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    })
    mockSyncGa4ForOrg.mockResolvedValueOnce(undefined)

    const { POST } = await import('@/app/api/v1/integrations/ga4/sync/route')
    await POST()

    expect(mockRequireApiRole).toHaveBeenCalledWith('admin')
  })

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { POST } = await import('@/app/api/v1/integrations/ga4/sync/route')
    const res = await POST()

    expect(res.status).toBe(401)
  })

  it('returns 403 when insufficient role', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValueOnce(new AuthError('Insufficient permissions', 403))

    const { POST } = await import('@/app/api/v1/integrations/ga4/sync/route')
    const res = await POST()

    expect(res.status).toBe(403)
  })

  it('returns 500 when sync fails', async () => {
    mockRequireApiRole.mockResolvedValueOnce({
      userId: 'user-1',
      organizationId: 'org-1',
      role: 'admin',
    })
    mockSyncGa4ForOrg.mockRejectedValueOnce(new Error('Token expired'))

    const { POST } = await import('@/app/api/v1/integrations/ga4/sync/route')
    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Token expired')
  })
})
