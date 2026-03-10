import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock token manager
const mockGetValidToken = vi.fn()
vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: (...args: unknown[]) => mockGetValidToken(...args),
}))

// Mock search console
const mockFetchSearchAnalytics = vi.fn()
const mockFetchSitemaps = vi.fn()
vi.mock('@/lib/google/search-console', () => ({
  fetchSearchAnalytics: (...args: unknown[]) => mockFetchSearchAnalytics(...args),
  fetchSitemaps: (...args: unknown[]) => mockFetchSitemaps(...args),
}))

// Mock supabase admin client
const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null })
const mockUpdate = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      upsert: mockUpsert,
      update: mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }
    return chain
  }),
}))

// Mock connection
vi.mock('../connection', () => ({
  getRedisConnection: vi.fn().mockReturnValue({}),
}))

describe('syncGscForOrg', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips silently when no active GSC connection', async () => {
    mockGetValidToken.mockRejectedValueOnce(new Error('No active connection'))

    const { syncGscForOrg } = await import('../gsc-sync-worker')
    await syncGscForOrg('org-123')

    expect(mockFetchSearchAnalytics).not.toHaveBeenCalled()
    expect(mockFetchSitemaps).not.toHaveBeenCalled()
  })

  it('fetches analytics and sitemaps then upserts data', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'https://example.com',
    })

    mockFetchSearchAnalytics.mockResolvedValueOnce({
      rows: [
        {
          keys: ['painting nj', 'https://example.com/painting', '2026-03-01'],
          clicks: 10,
          impressions: 200,
          ctr: 0.05,
          position: 8.5,
        },
      ],
    })

    mockFetchSitemaps.mockResolvedValueOnce([
      {
        path: 'https://example.com/sitemap.xml',
        isPending: false,
        warnings: '0',
        errors: '0',
        contents: [{ type: 'web', submitted: '20', indexed: '18' }],
      },
    ])

    const { syncGscForOrg } = await import('../gsc-sync-worker')
    await syncGscForOrg('org-123')

    // Should call search analytics with correct params
    expect(mockFetchSearchAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'ya29.test',
        siteUrl: 'https://example.com',
        dimensions: ['query', 'page', 'date'],
        rowLimit: 25000,
      }),
    )

    // Should upsert keyword rankings
    expect(mockUpsert).toHaveBeenCalled()

    // Should fetch sitemaps
    expect(mockFetchSitemaps).toHaveBeenCalledWith({
      accessToken: 'ya29.test',
      siteUrl: 'https://example.com',
    })
  })

  it('handles empty analytics rows without error', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'https://example.com',
    })

    mockFetchSearchAnalytics.mockResolvedValueOnce({ rows: [] })
    mockFetchSitemaps.mockResolvedValueOnce([])

    const { syncGscForOrg } = await import('../gsc-sync-worker')
    await expect(syncGscForOrg('org-123')).resolves.toBeUndefined()
  })
})
