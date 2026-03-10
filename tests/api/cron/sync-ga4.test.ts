import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mockSyncGa4ForOrg = vi.fn()
const mockFrom = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom }),
}))

vi.mock('@/lib/queue/ga4-sync-worker', () => ({
  syncGa4ForOrg: (...args: unknown[]) => mockSyncGa4ForOrg(...args),
}))

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {}
  if (secret) headers['authorization'] = `Bearer ${secret}`
  return new NextRequest('http://localhost/api/cron/sync-ga4', { headers })
}

describe('GET /api/cron/sync-ga4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('returns 401 without valid CRON_SECRET', async () => {
    const { GET } = await import('@/app/api/cron/sync-ga4/route')
    const res = await GET(makeRequest('wrong-secret'))

    expect(res.status).toBe(401)
  })

  it('returns 401 without authorization header', async () => {
    const { GET } = await import('@/app/api/cron/sync-ga4/route')
    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns synced: 0 when no active connections', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            not: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      }),
    })

    const { GET } = await import('@/app/api/cron/sync-ga4/route')
    const res = await GET(makeRequest('test-cron-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.synced).toBe(0)
  })

  it('syncs all active connections with GA4 property', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            not: () =>
              Promise.resolve({
                data: [{ organization_id: 'org-1' }, { organization_id: 'org-2' }],
                error: null,
              }),
          }),
        }),
      }),
    })
    mockSyncGa4ForOrg.mockResolvedValue(undefined)

    const { GET } = await import('@/app/api/cron/sync-ga4/route')
    const res = await GET(makeRequest('test-cron-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.synced).toBe(2)
    expect(body.failed).toBe(0)
    expect(mockSyncGa4ForOrg).toHaveBeenCalledWith('org-1')
    expect(mockSyncGa4ForOrg).toHaveBeenCalledWith('org-2')
  })

  it('handles partial failures gracefully', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            not: () =>
              Promise.resolve({
                data: [{ organization_id: 'org-1' }, { organization_id: 'org-2' }],
                error: null,
              }),
          }),
        }),
      }),
    })
    mockSyncGa4ForOrg.mockResolvedValueOnce(undefined)
    mockSyncGa4ForOrg.mockRejectedValueOnce(new Error('Token expired'))

    const { GET } = await import('@/app/api/cron/sync-ga4/route')
    const res = await GET(makeRequest('test-cron-secret'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.synced).toBe(1)
    expect(body.failed).toBe(1)
  })
})
