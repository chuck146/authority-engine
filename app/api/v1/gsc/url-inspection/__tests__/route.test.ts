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

const mockInspectUrl = vi.fn()
vi.mock('@/lib/google/search-console', () => ({
  inspectUrl: mockInspectUrl,
}))

function buildInspectRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/v1/gsc/url-inspection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/v1/gsc/url-inspection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns mapped inspection result for indexed URL', async () => {
    mockInspectUrl.mockResolvedValueOnce({
      inspectionResult: {
        indexStatusResult: {
          indexingState: 'INDEXING_ALLOWED',
          coverageState: 'SUBMITTED_AND_INDEXED',
          lastCrawlTime: '2026-03-04T08:00:00Z',
          crawledAs: 'DESKTOP',
          robotsTxtState: 'ALLOWED',
          pageFetchState: 'SUCCESSFUL',
        },
        mobileUsabilityResult: { verdict: 'MOBILE_FRIENDLY' },
        richResultsResult: { detectedItems: [] },
      },
    })

    const { POST } = await import('../route')
    const req = buildInspectRequest({ url: 'https://cleanestpainting.com/services/interior-painting' })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.indexingState).toBe('INDEXING_ALLOWED')
    expect(json.coverageState).toBe('SUBMITTED_AND_INDEXED')
    expect(json.crawlAllowed).toBe(true)
    expect(json.mobileUsability).toBe('MOBILE_FRIENDLY')
    expect(json.richResults).toEqual([])
  })

  it('handles blocked URL with rich results', async () => {
    mockInspectUrl.mockResolvedValueOnce({
      inspectionResult: {
        indexStatusResult: {
          indexingState: 'BLOCKED_BY_ROBOTS_TXT',
          coverageState: 'CRAWLED_NOT_INDEXED',
          lastCrawlTime: null,
          crawledAs: 'CRAWLED_AS_NONE',
          robotsTxtState: 'DISALLOWED',
          pageFetchState: 'BLOCKED_BY_ROBOTS_TXT',
        },
        mobileUsabilityResult: { verdict: 'UNKNOWN' },
        richResultsResult: {
          detectedItems: [
            { richResultType: 'FAQ', items: [{ name: 'FAQ item', issues: ['Missing field'] }] },
          ],
        },
      },
    })

    const { POST } = await import('../route')
    const req = buildInspectRequest({ url: 'https://cleanestpainting.com/blocked-page' })
    const res = await POST(req)
    const json = await res.json()

    expect(json.crawlAllowed).toBe(false)
    expect(json.robotsTxtState).toBe('DISALLOWED')
    expect(json.richResults).toHaveLength(1)
    expect(json.richResults[0].richResultType).toBe('FAQ')
  })

  it('returns 400 for invalid URL', async () => {
    const { POST } = await import('../route')
    const req = buildInspectRequest({ url: 'not-a-url' })
    const res = await POST(req)

    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBe('Invalid request body')
  })

  it('returns 400 when url is missing', async () => {
    const { POST } = await import('../route')
    const req = buildInspectRequest({})
    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('returns 500 on GSC API error', async () => {
    mockInspectUrl.mockRejectedValueOnce(new Error('GSC URL Inspection API error'))

    const { POST } = await import('../route')
    const req = buildInspectRequest({ url: 'https://cleanestpainting.com/test' })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
