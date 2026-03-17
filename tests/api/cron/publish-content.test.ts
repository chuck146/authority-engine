import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockPublishScheduledContent = vi.fn()

vi.mock('@/lib/queue/publish-worker', () => ({
  publishScheduledContent: (...args: unknown[]) => mockPublishScheduledContent(...args),
}))

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (secret) headers['authorization'] = `Bearer ${secret}`
  return new NextRequest('http://localhost/api/cron/publish-content', { headers })
}

describe('GET /api/cron/publish-content', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('returns 401 without valid CRON_SECRET', async () => {
    const { GET } = await import('@/app/api/cron/publish-content/route')
    const res = await GET(makeRequest('wrong-secret'))

    expect(res.status).toBe(401)
  })

  it('returns 401 without authorization header', async () => {
    const { GET } = await import('@/app/api/cron/publish-content/route')
    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns published: 0 when no due entries', async () => {
    mockPublishScheduledContent.mockResolvedValue({ published: 0, failed: 0 })

    const { GET } = await import('@/app/api/cron/publish-content/route')
    const res = await GET(makeRequest('test-cron-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.published).toBe(0)
    expect(body.failed).toBe(0)
  })

  it('publishes due entries', async () => {
    mockPublishScheduledContent.mockResolvedValue({ published: 3, failed: 0 })

    const { GET } = await import('@/app/api/cron/publish-content/route')
    const res = await GET(makeRequest('test-cron-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.published).toBe(3)
    expect(body.failed).toBe(0)
    expect(mockPublishScheduledContent).toHaveBeenCalledOnce()
  })

  it('handles partial failures gracefully', async () => {
    mockPublishScheduledContent.mockResolvedValue({ published: 2, failed: 1 })

    const { GET } = await import('@/app/api/cron/publish-content/route')
    const res = await GET(makeRequest('test-cron-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.published).toBe(2)
    expect(body.failed).toBe(1)
  })
})
