import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRequireApiRole = vi.fn()
const mockPublishScheduledContent = vi.fn()

vi.mock('@/lib/auth/api-guard', async () => {
  const actual =
    await vi.importActual<typeof import('@/lib/auth/api-guard')>('@/lib/auth/api-guard')
  return {
    ...actual,
    requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
  }
})

vi.mock('@/lib/queue/publish-worker', () => ({
  publishScheduledContent: (...args: unknown[]) => mockPublishScheduledContent(...args),
}))

describe('POST /api/v1/content/publish-scheduled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('returns 401 for non-admin users', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    mockRequireApiRole.mockRejectedValue(new AuthError('Forbidden', 403))

    const { POST } = await import('@/app/api/v1/content/publish-scheduled/route')
    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(403)
    expect(body.error).toBe('Forbidden')
  })

  it('publishes due entries for admin', async () => {
    mockRequireApiRole.mockResolvedValue({ organizationId: 'org-1', userId: 'user-1' })
    mockPublishScheduledContent.mockResolvedValue({ published: 5, failed: 0 })

    const { POST } = await import('@/app/api/v1/content/publish-scheduled/route')
    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.published).toBe(5)
    expect(body.failed).toBe(0)
    expect(body.publishedAt).toBeDefined()
  })

  it('returns 500 on unexpected error', async () => {
    mockRequireApiRole.mockResolvedValue({ organizationId: 'org-1', userId: 'user-1' })
    mockPublishScheduledContent.mockRejectedValue(new Error('Database connection failed'))

    const { POST } = await import('@/app/api/v1/content/publish-scheduled/route')
    const res = await POST()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('Database connection failed')
  })
})
