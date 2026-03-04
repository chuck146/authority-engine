import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'
import type { Ga4SyncJobData } from '../ga4-sync-worker'

// Mock token manager
const mockGetValidToken = vi.fn()
vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: (...args: unknown[]) => mockGetValidToken(...args),
}))

// Mock analytics
const mockRunReport = vi.fn()
vi.mock('@/lib/google/analytics', () => ({
  runReport: (...args: unknown[]) => mockRunReport(...args),
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

describe('processGa4SyncJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeJob(data: Ga4SyncJobData): Job<Ga4SyncJobData> {
    return { data } as Job<Ga4SyncJobData>
  }

  it('skips silently when no active GA4 connection', async () => {
    mockGetValidToken.mockRejectedValueOnce(new Error('No active connection'))

    const { processGa4SyncJob } = await import('../ga4-sync-worker')
    await processGa4SyncJob(makeJob({ organizationId: 'org-123' }))

    expect(mockRunReport).not.toHaveBeenCalled()
  })

  it('skips when propertyId is empty', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: '', // empty property
    })

    const { processGa4SyncJob } = await import('../ga4-sync-worker')
    await processGa4SyncJob(makeJob({ organizationId: 'org-123' }))

    expect(mockRunReport).not.toHaveBeenCalled()
  })

  it('fetches page metrics, traffic sources, and device data then upserts', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'properties/123456',
    })

    // 3 runReport calls: page metrics, traffic sources, device breakdown
    mockRunReport
      .mockResolvedValueOnce({
        rows: [
          {
            dimensionValues: [{ value: '/painting' }, { value: 'Painting' }, { value: '20260301' }],
            metricValues: [
              { value: '50' }, { value: '40' }, { value: '120' },
              { value: '0.35' }, { value: '95.2' }, { value: '0.65' },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            dimensionValues: [{ value: 'google' }, { value: 'organic' }],
            metricValues: [{ value: '60' }, { value: '45' }, { value: '0.3' }],
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            dimensionValues: [{ value: 'desktop' }],
            metricValues: [{ value: '60' }, { value: '50' }],
          },
        ],
      })

    const { processGa4SyncJob } = await import('../ga4-sync-worker')
    await processGa4SyncJob(makeJob({ organizationId: 'org-123' }))

    // Should call runReport 3 times
    expect(mockRunReport).toHaveBeenCalledTimes(3)

    // First call: page metrics with date dimension
    expect(mockRunReport).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'ya29.test',
        propertyId: 'properties/123456',
        request: expect.objectContaining({
          dimensions: expect.arrayContaining([{ name: 'pagePath' }, { name: 'pageTitle' }, { name: 'date' }]),
          limit: 25000,
        }),
      }),
    )

    // Should upsert page metrics
    expect(mockUpsert).toHaveBeenCalled()

    // Should update last synced timestamp
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('handles empty report rows without error', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'properties/123456',
    })

    mockRunReport.mockResolvedValue({ rows: [] })

    const { processGa4SyncJob } = await import('../ga4-sync-worker')
    await expect(
      processGa4SyncJob(makeJob({ organizationId: 'org-123' })),
    ).resolves.toBeUndefined()
  })
})
