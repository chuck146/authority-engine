import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'admin' })

vi.mock('@/lib/auth/api-guard', async (importActual) => {
  const actual = await importActual<typeof import('@/lib/auth/api-guard')>()
  return {
    ...actual,
    requireApiAuth: vi.fn().mockResolvedValue(mockAuth),
  }
})

vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: vi.fn().mockResolvedValue({
    accessToken: 'ya29.test',
    siteUrl: 'https://cleanestpainting.com',
  }),
}))

const mockFetchSearchAnalytics = vi.fn()
const mockFetchSitemaps = vi.fn()

vi.mock('@/lib/google/search-console', () => ({
  fetchSearchAnalytics: mockFetchSearchAnalytics,
  fetchSitemaps: mockFetchSitemaps,
}))

function buildApiRows(queries: string[]) {
  return queries.map((q, i) => ({
    keys: [q],
    clicks: 100 - i * 10,
    impressions: 2000 - i * 200,
    ctr: 0.05 - i * 0.005,
    position: 5 + i * 2,
  }))
}

describe('GET /api/v1/gsc/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns full GSC overview with summary, queries, pages, and sitemaps', async () => {
    const queryRows = buildApiRows(['painting nj', 'interior painting', 'exterior painting'])
    mockFetchSearchAnalytics
      .mockResolvedValueOnce({ rows: queryRows }) // current queries
      .mockResolvedValueOnce({ rows: buildApiRows(['painting nj']) }) // previous queries
      .mockResolvedValueOnce({
        rows: [
          {
            keys: ['https://example.com/'],
            clicks: 50,
            impressions: 1000,
            ctr: 0.05,
            position: 3.2,
          },
        ],
      }) // current pages

    mockFetchSitemaps.mockResolvedValueOnce([
      {
        path: 'https://cleanestpainting.com/sitemap.xml',
        isPending: false,
        lastDownloaded: '2026-03-04',
        warnings: '0',
        errors: '1',
        contents: [{ type: 'web', submitted: '45', indexed: '38' }],
      },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.isConnected).toBe(true)
    expect(json.siteUrl).toBe('https://cleanestpainting.com')
    expect(json.summary).toBeDefined()
    expect(json.summary.clicks).toBeGreaterThan(0)
    expect(json.topQueries).toHaveLength(3)
    expect(json.topQueries[0].query).toBe('painting nj')
    expect(json.topPages).toHaveLength(1)
    expect(json.sitemaps).toHaveLength(1)
    expect(json.sitemaps[0].errors).toBe(1)
    expect(json.indexingCoverage).toBeDefined()
    expect(json.indexingCoverage.valid).toBe(38)
    expect(json.indexingCoverage.excluded).toBe(7)
  })

  it('computes trend percentages between current and previous periods', async () => {
    mockFetchSearchAnalytics
      .mockResolvedValueOnce({
        rows: [{ keys: ['test'], clicks: 200, impressions: 4000, ctr: 0.05, position: 10 }],
      })
      .mockResolvedValueOnce({
        rows: [{ keys: ['test'], clicks: 100, impressions: 4000, ctr: 0.025, position: 20 }],
      })
      .mockResolvedValueOnce({ rows: [] })
    mockFetchSitemaps.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.summary.clicksTrend).toBe(100) // 100→200 = +100%
    expect(json.summary.impressionsTrend).toBe(0) // 4000→4000 = 0%
    expect(json.summary.positionTrend).toBe(-50) // 20→10 = -50% (improvement)
  })

  it('handles empty search analytics gracefully', async () => {
    mockFetchSearchAnalytics.mockResolvedValue({ rows: [] })
    mockFetchSitemaps.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.summary.clicks).toBe(0)
    expect(json.topQueries).toEqual([])
    expect(json.topPages).toEqual([])
    expect(json.indexingCoverage).toBeNull()
  })

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 500 when GSC API fails', async () => {
    mockFetchSearchAnalytics.mockRejectedValueOnce(new Error('GSC API error (403): forbidden'))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
