import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listAccountSummaries, runReport, batchRunReports } from '../analytics'

const mockFetch = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listAccountSummaries', () => {
  it('returns account summaries from the Admin API', async () => {
    const summaries = [
      {
        name: 'accountSummaries/123',
        account: 'accounts/123',
        displayName: 'Cleanest Painting',
        propertySummaries: [
          { property: 'properties/456', displayName: 'Main Site', propertyType: 'PROPERTY_TYPE_ORDINARY', parent: 'accounts/123' },
        ],
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ accountSummaries: summaries }),
    })

    const result = await listAccountSummaries({ accessToken: 'ya29.test' })
    expect(result).toEqual(summaries)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200',
      { headers: { Authorization: 'Bearer ya29.test' } },
    )
  })

  it('returns empty array when no accountSummaries field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const result = await listAccountSummaries({ accessToken: 'ya29.test' })
    expect(result).toEqual([])
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    })

    await expect(listAccountSummaries({ accessToken: 'ya29.test' })).rejects.toThrow(
      'GA4 Admin API error (403): Forbidden',
    )
  })
})

describe('runReport', () => {
  it('sends report request and returns response', async () => {
    const reportResponse = {
      rows: [{ dimensionValues: [{ value: '2026-03-01' }], metricValues: [{ value: '100' }] }],
      rowCount: 1,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(reportResponse),
    })

    const result = await runReport({
      accessToken: 'ya29.test',
      propertyId: 'properties/456',
      request: {
        dateRanges: [{ startDate: '2026-02-01', endDate: '2026-02-28' }],
        metrics: [{ name: 'sessions' }],
      },
    })

    expect(result).toEqual(reportResponse)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://analyticsdata.googleapis.com/v1beta/properties/456:runReport',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('strips properties/ prefix from property ID', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ rows: [] }),
    })

    await runReport({
      accessToken: 'ya29.test',
      propertyId: 'properties/789',
      request: {
        dateRanges: [{ startDate: '2026-02-01', endDate: '2026-02-28' }],
        metrics: [{ name: 'sessions' }],
      },
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/properties/789:runReport'),
      expect.any(Object),
    )
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('Bad Request'),
    })

    await expect(
      runReport({
        accessToken: 'ya29.test',
        propertyId: 'properties/456',
        request: {
          dateRanges: [{ startDate: '2026-02-01', endDate: '2026-02-28' }],
          metrics: [{ name: 'sessions' }],
        },
      }),
    ).rejects.toThrow('GA4 Data API error (400): Bad Request')
  })
})

describe('batchRunReports', () => {
  it('sends batch request and returns reports array', async () => {
    const reports = [
      { rows: [{ metricValues: [{ value: '100' }] }] },
      { rows: [{ metricValues: [{ value: '200' }] }] },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reports }),
    })

    const result = await batchRunReports({
      accessToken: 'ya29.test',
      propertyId: 'properties/456',
      requests: [
        { dateRanges: [{ startDate: '2026-02-01', endDate: '2026-02-28' }], metrics: [{ name: 'sessions' }] },
        { dateRanges: [{ startDate: '2026-02-01', endDate: '2026-02-28' }], metrics: [{ name: 'totalUsers' }] },
      ],
    })

    expect(result).toEqual(reports)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://analyticsdata.googleapis.com/v1beta/properties/456:batchRunReports',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('returns empty array when no reports field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    })

    const result = await batchRunReports({
      accessToken: 'ya29.test',
      propertyId: 'properties/456',
      requests: [],
    })

    expect(result).toEqual([])
  })

  it('throws on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve('Rate limit exceeded'),
    })

    await expect(
      batchRunReports({
        accessToken: 'ya29.test',
        propertyId: 'properties/456',
        requests: [],
      }),
    ).rejects.toThrow('GA4 Batch Report API error (429): Rate limit exceeded')
  })
})
