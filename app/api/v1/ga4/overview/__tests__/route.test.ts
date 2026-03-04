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
    siteUrl: 'properties/123456',
  }),
}))

const mockBatchRunReports = vi.fn()
vi.mock('@/lib/google/analytics', () => ({
  batchRunReports: mockBatchRunReports,
}))

function makeRows(values: Array<{ dims: string[]; metrics: string[] }>) {
  return values.map((v) => ({
    dimensionValues: v.dims.map((d) => ({ value: d })),
    metricValues: v.metrics.map((m) => ({ value: m })),
  }))
}

describe('GET /api/v1/ga4/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns full GA4 overview with summary, trend, pages, sources, and devices', async () => {
    mockBatchRunReports.mockResolvedValueOnce([
      // 0: daily totals (current)
      { rows: makeRows([{ dims: ['20260301'], metrics: ['100', '80', '250', '0.4'] }]) },
      // 1: top pages
      { rows: makeRows([{ dims: ['/services/painting', 'Painting Services'], metrics: ['50', '40', '120', '0.35', '95.2'] }]) },
      // 2: traffic sources
      { rows: makeRows([{ dims: ['google', 'organic'], metrics: ['60', '45', '0.3'] }]) },
      // 3: device breakdown
      { rows: makeRows([{ dims: ['desktop'], metrics: ['60', '50'] }, { dims: ['mobile'], metrics: ['40', '30'] }]) },
      // 4: daily totals (previous)
      { rows: makeRows([{ dims: ['20260201'], metrics: ['80', '60', '200', '0.45'] }]) },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.isConnected).toBe(true)
    expect(json.propertyId).toBe('properties/123456')

    // Summary
    expect(json.summary).toBeDefined()
    expect(json.summary.sessions).toBe(100)
    expect(json.summary.users).toBe(80)
    expect(json.summary.pageviews).toBe(250)
    expect(json.summary.sessionsTrend).toBe(25) // 80→100 = +25%

    // Daily trend
    expect(json.dailyTrend).toHaveLength(1)
    expect(json.dailyTrend[0].sessions).toBe(100)

    // Top pages
    expect(json.topPages).toHaveLength(1)
    expect(json.topPages[0].pagePath).toBe('/services/painting')

    // Traffic sources
    expect(json.trafficSources).toHaveLength(1)
    expect(json.trafficSources[0].source).toBe('google')

    // Device breakdown
    expect(json.deviceBreakdown).toHaveLength(2)
    expect(json.deviceBreakdown[0].deviceCategory).toBe('desktop')
    expect(json.deviceBreakdown[0].percentage).toBe(60) // 60/(60+40) = 60%
  })

  it('handles empty reports gracefully', async () => {
    mockBatchRunReports.mockResolvedValueOnce([
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.summary.sessions).toBe(0)
    expect(json.dailyTrend).toEqual([])
    expect(json.topPages).toEqual([])
    expect(json.trafficSources).toEqual([])
    expect(json.deviceBreakdown).toEqual([])
  })

  it('handles missing report indices gracefully', async () => {
    mockBatchRunReports.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.summary.sessions).toBe(0)
  })

  it('returns 401 when not authenticated', async () => {
    const { AuthError } = await import('@/lib/auth/api-guard')
    const { requireApiAuth } = await import('@/lib/auth/api-guard')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(new AuthError('Unauthorized', 401))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 500 when GA4 API fails', async () => {
    mockBatchRunReports.mockRejectedValueOnce(new Error('GA4 API error (403): forbidden'))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
