import { describe, it, expect, vi, beforeEach } from 'vitest'
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

const mockFetchSitemaps = vi.fn()
vi.mock('@/lib/google/search-console', () => ({
  fetchSitemaps: mockFetchSitemaps,
}))

describe('GET /api/v1/gsc/sitemaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns parsed sitemaps with numeric warnings/errors', async () => {
    mockFetchSitemaps.mockResolvedValueOnce([
      {
        path: 'https://cleanestpainting.com/sitemap.xml',
        isPending: false,
        lastSubmitted: '2026-03-01',
        lastDownloaded: '2026-03-04',
        warnings: '2',
        errors: '1',
        contents: [
          { type: 'web', submitted: '50', indexed: '42' },
          { type: 'image', submitted: '30', indexed: '28' },
        ],
      },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sitemaps).toHaveLength(1)
    const sm = json.sitemaps[0]
    expect(sm.warnings).toBe(2)
    expect(sm.errors).toBe(1)
    expect(sm.contents).toHaveLength(2)
    expect(sm.contents[0].submitted).toBe(50)
    expect(sm.contents[0].indexed).toBe(42)
  })

  it('returns empty array when no sitemaps', async () => {
    mockFetchSitemaps.mockResolvedValueOnce([])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    expect(json.sitemaps).toEqual([])
  })

  it('handles missing optional fields', async () => {
    mockFetchSitemaps.mockResolvedValueOnce([
      {
        path: 'https://cleanestpainting.com/sitemap.xml',
        isPending: true,
        warnings: '0',
        errors: '0',
      },
    ])

    const { GET } = await import('../route')
    const res = await GET()
    const json = await res.json()

    const sm = json.sitemaps[0]
    expect(sm.lastSubmitted).toBeNull()
    expect(sm.lastDownloaded).toBeNull()
    expect(sm.contents).toEqual([])
  })

  it('returns 500 on GSC API error', async () => {
    mockFetchSitemaps.mockRejectedValueOnce(new Error('GSC Sitemaps API error'))

    const { GET } = await import('../route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})
