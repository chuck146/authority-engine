import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { buildAuthContext } from '@/tests/factories'

const mockAuth = buildAuthContext({ role: 'editor' })

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
vi.mock('@/lib/google/search-console', () => ({
  fetchSearchAnalytics: mockFetchSearchAnalytics,
}))

function buildRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/v1/gsc/search-analytics')
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }
  return new NextRequest(url)
}

describe('GET /api/v1/gsc/search-analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns search analytics rows with rounded values', async () => {
    mockFetchSearchAnalytics.mockResolvedValueOnce({
      rows: [
        { keys: ['painting nj'], clicks: 85, impressions: 2400, ctr: 0.035416, position: 8.234 },
        { keys: ['house painting'], clicks: 42, impressions: 1800, ctr: 0.023333, position: 12.789 },
      ],
    })

    const { GET } = await import('../route')
    const req = buildRequest({ startDate: '2026-02-01', endDate: '2026-02-28' })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.rows).toHaveLength(2)
    expect(json.rows[0].ctr).toBe(0.035) // rounded to 3 decimals
    expect(json.rows[0].position).toBe(8.2) // rounded to 1 decimal
    expect(json.totalRows).toBe(2)
  })

  it('passes dimensions parameter to GSC API', async () => {
    mockFetchSearchAnalytics.mockResolvedValueOnce({ rows: [] })

    const { GET } = await import('../route')
    const req = buildRequest({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      dimensions: 'query,page',
    })
    const res = await GET(req)
    expect(res.status).toBe(200)

    expect(mockFetchSearchAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        dimensions: ['query', 'page'],
        siteUrl: 'https://cleanestpainting.com',
      }),
    )
  })

  it('returns 400 for invalid date format', async () => {
    const { GET } = await import('../route')
    const req = buildRequest({ startDate: 'not-a-date', endDate: '2026-02-28' })
    const res = await GET(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid query parameters')
    expect(json.details).toBeDefined()
  })

  it('returns 400 when startDate is missing', async () => {
    const { GET } = await import('../route')
    const req = buildRequest({ endDate: '2026-02-28' })
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('applies default rowLimit and startRow', async () => {
    mockFetchSearchAnalytics.mockResolvedValueOnce({ rows: [] })

    const { GET } = await import('../route')
    const req = buildRequest({ startDate: '2026-02-01', endDate: '2026-02-28' })
    await GET(req)

    expect(mockFetchSearchAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({ rowLimit: 1000, startRow: 0 }),
    )
  })

  it('returns 500 on GSC API error', async () => {
    mockFetchSearchAnalytics.mockRejectedValueOnce(new Error('GSC error'))

    const { GET } = await import('../route')
    const req = buildRequest({ startDate: '2026-02-01', endDate: '2026-02-28' })
    const res = await GET(req)
    expect(res.status).toBe(500)
  })
})
