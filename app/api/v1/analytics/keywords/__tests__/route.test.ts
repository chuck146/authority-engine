import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
  }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

const mockGetKeywordRankings = vi.fn()

vi.mock('@/lib/analytics/keyword-rankings', () => ({
  getKeywordRankings: mockGetKeywordRankings,
}))

describe('GET /api/v1/analytics/keywords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated keyword rankings', async () => {
    mockGetKeywordRankings.mockResolvedValue({
      items: [
        {
          query: 'painting nj',
          avgPosition: 8.2,
          totalClicks: 85,
          totalImpressions: 2400,
          avgCtr: 0.035,
          positionChange: 1.3,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest('http://localhost/api/v1/analytics/keywords?range=28d')
    const response = await GET(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items).toHaveLength(1)
    expect(body.items[0].query).toBe('painting nj')
    expect(body.total).toBe(1)
  })

  it('passes search filter to service', async () => {
    mockGetKeywordRankings.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 25,
    })

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/keywords?range=28d&search=painting',
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(mockGetKeywordRankings).toHaveBeenCalledWith(
      expect.anything(),
      mockAuth.organizationId,
      expect.objectContaining({ startDate: expect.any(String) }),
      expect.objectContaining({ startDate: expect.any(String) }),
      expect.objectContaining({ search: 'painting' }),
    )
  })

  it('returns 401 for unauthenticated requests', async () => {
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    const { AuthError } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const request = new NextRequest('http://localhost/api/v1/analytics/keywords')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })
})
