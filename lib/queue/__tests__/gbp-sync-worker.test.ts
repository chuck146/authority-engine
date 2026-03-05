import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'
import type { GbpSyncJobData } from '../gbp-sync-worker'

// Mock token manager
const mockGetValidToken = vi.fn()
vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: (...args: unknown[]) => mockGetValidToken(...args),
}))

// Mock business profile
const mockListReviews = vi.fn()
vi.mock('@/lib/google/business-profile', () => ({
  listReviews: (...args: unknown[]) => mockListReviews(...args),
}))

// Mock starRatingToNumber
const mockStarRatingToNumber = vi.fn((rating: string) => {
  const map: Record<string, number> = {
    STAR_RATING_UNSPECIFIED: 0,
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  }
  return map[rating] || 0
})
vi.mock('@/types/gbp', () => ({
  starRatingToNumber: (rating: string) => mockStarRatingToNumber(rating),
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

describe('processGbpSyncJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function makeJob(data: GbpSyncJobData): Job<GbpSyncJobData> {
    return { data } as Job<GbpSyncJobData>
  }

  function buildGbpReview(overrides: Record<string, unknown> = {}) {
    return {
      name: 'accounts/123/locations/456/reviews/rev-1',
      reviewId: 'rev-1',
      reviewer: {
        displayName: 'Jane Doe',
        profilePhotoUrl: 'https://photo.example.com/jane',
      },
      starRating: 'FIVE',
      comment: 'Amazing painting work!',
      createTime: '2026-03-01T12:00:00Z',
      updateTime: '2026-03-01T12:00:00Z',
      reviewReply: undefined,
      ...overrides,
    }
  }

  it('skips silently when no active GBP connection', async () => {
    mockGetValidToken.mockRejectedValueOnce(new Error('No active connection'))

    const { processGbpSyncJob } = await import('../gbp-sync-worker')
    await processGbpSyncJob(makeJob({ organizationId: 'org-123' }))

    expect(mockListReviews).not.toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('skips silently when no location name', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: '',
    })

    const { processGbpSyncJob } = await import('../gbp-sync-worker')
    await processGbpSyncJob(makeJob({ organizationId: 'org-123' }))

    expect(mockListReviews).not.toHaveBeenCalled()
    expect(mockUpsert).not.toHaveBeenCalled()
  })

  it('fetches reviews and upserts into reviews table', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'accounts/123/locations/456',
    })

    const review = buildGbpReview()
    mockListReviews.mockResolvedValueOnce({
      reviews: [review],
      totalReviewCount: 1,
      averageRating: 5,
      nextPageToken: undefined,
    })

    const { processGbpSyncJob } = await import('../gbp-sync-worker')
    await processGbpSyncJob(makeJob({ organizationId: 'org-123' }))

    expect(mockListReviews).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'ya29.test',
        locationName: 'accounts/123/locations/456',
        pageSize: 50,
      }),
    )

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          organization_id: 'org-123',
          platform: 'google',
          external_id: 'rev-1',
          reviewer_name: 'Jane Doe',
          rating: 5,
          review_text: 'Amazing painting work!',
          review_date: '2026-03-01T12:00:00Z',
        }),
      ]),
      expect.objectContaining({
        onConflict: 'organization_id,platform,external_id',
        ignoreDuplicates: false,
      }),
    )
  })

  it('maps starRating enum to number correctly', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'accounts/123/locations/456',
    })

    const reviews = [
      buildGbpReview({ reviewId: 'rev-1', starRating: 'FIVE' }),
      buildGbpReview({ reviewId: 'rev-2', starRating: 'THREE' }),
      buildGbpReview({ reviewId: 'rev-3', starRating: 'ONE' }),
    ]

    mockListReviews.mockResolvedValueOnce({
      reviews,
      totalReviewCount: 3,
      averageRating: 3,
      nextPageToken: undefined,
    })

    const { processGbpSyncJob } = await import('../gbp-sync-worker')
    await processGbpSyncJob(makeJob({ organizationId: 'org-123' }))

    expect(mockStarRatingToNumber).toHaveBeenCalledWith('FIVE')
    expect(mockStarRatingToNumber).toHaveBeenCalledWith('THREE')
    expect(mockStarRatingToNumber).toHaveBeenCalledWith('ONE')

    // Verify the upserted rows contain the correct numeric ratings
    expect(mockUpsert).toHaveBeenCalled()
    const upsertedRows = mockUpsert.mock.calls[0]![0] as Array<{
      rating: number
    }>
    expect(upsertedRows[0]!.rating).toBe(5)
    expect(upsertedRows[1]!.rating).toBe(3)
    expect(upsertedRows[2]!.rating).toBe(1)
  })

  it('handles pagination (multiple pages of reviews)', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'accounts/123/locations/456',
    })

    // First page returns nextPageToken
    mockListReviews.mockResolvedValueOnce({
      reviews: [buildGbpReview({ reviewId: 'rev-1' })],
      totalReviewCount: 2,
      averageRating: 5,
      nextPageToken: 'page-2-token',
    })

    // Second page has no nextPageToken (last page)
    mockListReviews.mockResolvedValueOnce({
      reviews: [buildGbpReview({ reviewId: 'rev-2' })],
      totalReviewCount: 2,
      averageRating: 5,
      nextPageToken: undefined,
    })

    const { processGbpSyncJob } = await import('../gbp-sync-worker')
    await processGbpSyncJob(makeJob({ organizationId: 'org-123' }))

    // Should have called listReviews twice
    expect(mockListReviews).toHaveBeenCalledTimes(2)

    // First call without pageToken
    expect(mockListReviews).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        accessToken: 'ya29.test',
        locationName: 'accounts/123/locations/456',
        pageSize: 50,
        pageToken: undefined,
      }),
    )

    // Second call with pageToken from first response
    expect(mockListReviews).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        accessToken: 'ya29.test',
        locationName: 'accounts/123/locations/456',
        pageSize: 50,
        pageToken: 'page-2-token',
      }),
    )

    // Should have upserted twice (once per page)
    expect(mockUpsert).toHaveBeenCalledTimes(2)
  })

  it('updates last_synced_at on connection after successful sync', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'accounts/123/locations/456',
    })

    mockListReviews.mockResolvedValueOnce({
      reviews: [buildGbpReview()],
      totalReviewCount: 1,
      averageRating: 5,
      nextPageToken: undefined,
    })

    const { processGbpSyncJob } = await import('../gbp-sync-worker')
    await processGbpSyncJob(makeJob({ organizationId: 'org-123' }))

    // Should call update on google_connections with last_synced_at and sync_error: null
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        last_synced_at: expect.any(String),
        sync_error: null,
        updated_at: expect.any(String),
      }),
    )
  })

  it('records sync_error on connection when API fails', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'accounts/123/locations/456',
    })

    mockListReviews.mockRejectedValueOnce(new Error('GBP API rate limited'))

    const { processGbpSyncJob } = await import('../gbp-sync-worker')

    await expect(
      processGbpSyncJob(makeJob({ organizationId: 'org-123' })),
    ).rejects.toThrow('GBP API rate limited')

    // Should record the error on the connection
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        sync_error: 'GBP API rate limited',
        updated_at: expect.any(String),
      }),
    )
  })

  it('re-throws error so BullMQ marks job failed', async () => {
    mockGetValidToken.mockResolvedValueOnce({
      accessToken: 'ya29.test',
      siteUrl: 'accounts/123/locations/456',
    })

    const apiError = new Error('Network timeout')
    mockListReviews.mockRejectedValueOnce(apiError)

    const { processGbpSyncJob } = await import('../gbp-sync-worker')

    await expect(
      processGbpSyncJob(makeJob({ organizationId: 'org-123' })),
    ).rejects.toThrow('Network timeout')
  })
})
