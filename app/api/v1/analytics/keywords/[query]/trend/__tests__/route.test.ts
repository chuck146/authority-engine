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

const mockGetKeywordTrend = vi.fn()

vi.mock('@/lib/analytics/keyword-rankings', () => ({
  getKeywordTrend: mockGetKeywordTrend,
}))

describe('GET /api/v1/analytics/keywords/[query]/trend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns trend data for a keyword', async () => {
    mockGetKeywordTrend.mockResolvedValue([
      { date: '2026-03-05', position: 8, clicks: 10, impressions: 200 },
      { date: '2026-03-06', position: 7.5, clicks: 12, impressions: 250 },
    ])

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/keywords/painting%20nj/trend?range=28d',
    )
    const response = await GET(request, {
      params: Promise.resolve({ query: 'painting%20nj' }),
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body[0].date).toBe('2026-03-05')
  })

  it('decodes URL-encoded query parameter', async () => {
    mockGetKeywordTrend.mockResolvedValue([])

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/keywords/interior%20painting%20nj/trend?range=7d',
    )
    await GET(request, {
      params: Promise.resolve({ query: 'interior%20painting%20nj' }),
    })

    expect(mockGetKeywordTrend).toHaveBeenCalledWith(
      expect.anything(),
      mockAuth.organizationId,
      'interior painting nj',
      expect.objectContaining({ startDate: expect.any(String) }),
    )
  })

  it('returns 401 for unauthenticated requests', async () => {
    const { requireApiAuth, AuthError } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const request = new NextRequest(
      'http://localhost/api/v1/analytics/keywords/test/trend',
    )
    const response = await GET(request, {
      params: Promise.resolve({ query: 'test' }),
    })

    expect(response.status).toBe(401)
  })
})
