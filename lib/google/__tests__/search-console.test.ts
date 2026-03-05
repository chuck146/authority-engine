import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchSearchAnalytics, fetchSitemaps, inspectUrl, listSites } from '../search-console'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchSearchAnalytics', () => {
  it('posts correct query to Search Analytics API', async () => {
    const mockResponse = {
      rows: [{ keys: ['test query'], clicks: 10, impressions: 100, ctr: 0.1, position: 5.2 }],
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 }),
    )

    const result = await fetchSearchAnalytics({
      accessToken: 'ya29.test',
      siteUrl: 'sc-domain:example.com',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      dimensions: ['query', 'page'],
      rowLimit: 500,
    })

    expect(result.rows).toHaveLength(1)
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain('sc-domain%3Aexample.com')
    expect(url).toContain('searchAnalytics/query')
    expect(opts?.method).toBe('POST')
    expect(opts?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer ya29.test' }))

    const body = JSON.parse(opts?.body as string)
    expect(body.startDate).toBe('2026-02-01')
    expect(body.dimensions).toEqual(['query', 'page'])
    expect(body.rowLimit).toBe(500)
  })

  it('uses default dimensions and rowLimit', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ rows: [] }), { status: 200 }),
    )

    await fetchSearchAnalytics({
      accessToken: 'ya29.test',
      siteUrl: 'https://example.com',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    })

    const body = JSON.parse(vi.mocked(global.fetch).mock.calls[0]![1]?.body as string)
    expect(body.dimensions).toEqual(['query'])
    expect(body.rowLimit).toBe(1000)
    expect(body.startRow).toBe(0)
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Forbidden', { status: 403 }))

    await expect(
      fetchSearchAnalytics({
        accessToken: 'bad',
        siteUrl: 'https://example.com',
        startDate: '2026-02-01',
        endDate: '2026-02-28',
      }),
    ).rejects.toThrow('GSC Search Analytics API error (403)')
  })
})

describe('fetchSitemaps', () => {
  it('fetches sitemap list', async () => {
    const mockData = {
      sitemap: [
        { path: 'https://example.com/sitemap.xml', isPending: false, warnings: '0', errors: '0' },
      ],
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    )

    const result = await fetchSitemaps({ accessToken: 'ya29.test', siteUrl: 'https://example.com' })
    expect(result).toHaveLength(1)
    expect(result[0]!.path).toBe('https://example.com/sitemap.xml')
  })

  it('returns empty array when no sitemaps', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    )

    const result = await fetchSitemaps({ accessToken: 'ya29.test', siteUrl: 'https://example.com' })
    expect(result).toEqual([])
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Not Found', { status: 404 }))

    await expect(
      fetchSitemaps({ accessToken: 'bad', siteUrl: 'https://example.com' }),
    ).rejects.toThrow('GSC Sitemaps API error (404)')
  })
})

describe('inspectUrl', () => {
  it('posts inspection request', async () => {
    const mockResult = { inspectionResult: { indexStatusResult: { verdict: 'PASS' } } }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockResult), { status: 200 }),
    )

    const result = await inspectUrl({
      accessToken: 'ya29.test',
      siteUrl: 'https://example.com',
      inspectionUrl: 'https://example.com/services/painting',
    })

    expect(result).toEqual(mockResult)
    const [url, opts] = vi.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain('urlInspection/index:inspect')
    const body = JSON.parse(opts?.body as string)
    expect(body.inspectionUrl).toBe('https://example.com/services/painting')
    expect(body.siteUrl).toBe('https://example.com')
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Server Error', { status: 500 }))

    await expect(
      inspectUrl({
        accessToken: 'bad',
        siteUrl: 'https://example.com',
        inspectionUrl: 'https://example.com/test',
      }),
    ).rejects.toThrow('GSC URL Inspection API error (500)')
  })
})

describe('listSites', () => {
  it('fetches available GSC properties', async () => {
    const mockData = {
      siteEntry: [
        { siteUrl: 'https://example.com', permissionLevel: 'siteOwner' },
        { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' },
      ],
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), { status: 200 }),
    )

    const result = await listSites({ accessToken: 'ya29.test' })
    expect(result).toHaveLength(2)
    expect(result[0]!.permissionLevel).toBe('siteOwner')
  })

  it('returns empty array when no sites', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    )

    const result = await listSites({ accessToken: 'ya29.test' })
    expect(result).toEqual([])
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))

    await expect(listSites({ accessToken: 'bad' })).rejects.toThrow('GSC Sites API error (401)')
  })
})
