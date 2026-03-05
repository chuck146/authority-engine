import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listAccounts,
  listLocations,
  listReviews,
  replyToReview,
  deleteReply,
} from '../business-profile'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('listAccounts', () => {
  it('returns parsed accounts from API', async () => {
    const mockAccounts = [
      {
        name: 'accounts/123',
        accountName: 'Cleanest Painting',
        type: 'PERSONAL' as const,
        verificationState: 'VERIFIED' as const,
      },
      {
        name: 'accounts/456',
        accountName: 'Second Business',
        type: 'ORGANIZATION' as const,
        verificationState: 'UNVERIFIED' as const,
      },
    ]

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ accounts: mockAccounts }), { status: 200 }),
    )

    const result = await listAccounts({ accessToken: 'ya29.test' })

    expect(result).toHaveLength(2)
    expect(result[0]!.name).toBe('accounts/123')
    expect(result[0]!.accountName).toBe('Cleanest Painting')
    expect(result[1]!.type).toBe('ORGANIZATION')

    const [url, opts] = vi.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain('mybusinessaccountmanagement.googleapis.com/v1/accounts')
    expect(opts?.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer ya29.test' }),
    )
  })

  it('returns empty array when no accounts', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    )

    const result = await listAccounts({ accessToken: 'ya29.test' })
    expect(result).toEqual([])
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Unauthorized', { status: 401 }),
    )

    await expect(listAccounts({ accessToken: 'bad' })).rejects.toThrow(
      'GBP Accounts API error (401)',
    )
  })
})

describe('listLocations', () => {
  it('returns locations with pagination', async () => {
    const page1Locations = [
      { name: 'locations/111', title: 'Main Office' },
    ]
    const page2Locations = [
      { name: 'locations/222', title: 'Branch Office' },
    ]

    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ locations: page1Locations, nextPageToken: 'page2token' }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ locations: page2Locations }), { status: 200 }),
      )

    const result = await listLocations({
      accessToken: 'ya29.test',
      accountId: 'accounts/123',
    })

    expect(result).toHaveLength(2)
    expect(result[0]!.name).toBe('locations/111')
    expect(result[1]!.name).toBe('locations/222')

    // Verify first request has readMask and no pageToken
    const [url1] = vi.mocked(global.fetch).mock.calls[0]!
    expect(String(url1)).toContain('mybusinessbusinessinformation.googleapis.com/v1/accounts/123/locations')
    expect(String(url1)).toContain('readMask=')
    expect(String(url1)).not.toContain('pageToken=')

    // Verify second request includes pageToken
    const [url2] = vi.mocked(global.fetch).mock.calls[1]!
    expect(String(url2)).toContain('pageToken=page2token')
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Forbidden', { status: 403 }),
    )

    await expect(
      listLocations({ accessToken: 'bad', accountId: 'accounts/123' }),
    ).rejects.toThrow('GBP Locations API error (403)')
  })
})

describe('listReviews', () => {
  it('returns reviews with metadata', async () => {
    const mockReviews = [
      {
        name: 'accounts/123/locations/456/reviews/abc',
        reviewId: 'abc',
        reviewer: { displayName: 'John Doe' },
        starRating: 'FIVE' as const,
        comment: 'Great painting job!',
        createTime: '2026-03-01T10:00:00Z',
        updateTime: '2026-03-01T10:00:00Z',
      },
    ]

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          reviews: mockReviews,
          totalReviewCount: 42,
          averageRating: 4.8,
          nextPageToken: 'nextPage123',
        }),
        { status: 200 },
      ),
    )

    const result = await listReviews({
      accessToken: 'ya29.test',
      locationName: 'accounts/123/locations/456',
    })

    expect(result.reviews).toHaveLength(1)
    expect(result.reviews[0]!.starRating).toBe('FIVE')
    expect(result.totalReviewCount).toBe(42)
    expect(result.averageRating).toBe(4.8)
    expect(result.nextPageToken).toBe('nextPage123')

    const [url] = vi.mocked(global.fetch).mock.calls[0]!
    expect(String(url)).toContain('mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews')
    expect(String(url)).toContain('pageSize=50')
  })

  it('handles empty reviews response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 }),
    )

    const result = await listReviews({
      accessToken: 'ya29.test',
      locationName: 'accounts/123/locations/456',
    })

    expect(result.reviews).toEqual([])
    expect(result.totalReviewCount).toBe(0)
    expect(result.averageRating).toBe(0)
    expect(result.nextPageToken).toBeUndefined()
  })

  it('passes pageToken when provided', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ reviews: [], totalReviewCount: 0, averageRating: 0 }),
        { status: 200 },
      ),
    )

    await listReviews({
      accessToken: 'ya29.test',
      locationName: 'accounts/123/locations/456',
      pageSize: 25,
      pageToken: 'customToken',
    })

    const [url] = vi.mocked(global.fetch).mock.calls[0]!
    expect(String(url)).toContain('pageSize=25')
    expect(String(url)).toContain('pageToken=customToken')
  })
})

describe('replyToReview', () => {
  it('sends PUT with comment', async () => {
    const mockReply = {
      comment: 'Thank you for your kind words!',
      updateTime: '2026-03-05T12:00:00Z',
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockReply), { status: 200 }),
    )

    const result = await replyToReview({
      accessToken: 'ya29.test',
      reviewName: 'accounts/123/locations/456/reviews/abc',
      comment: 'Thank you for your kind words!',
    })

    expect(result.comment).toBe('Thank you for your kind words!')
    expect(result.updateTime).toBe('2026-03-05T12:00:00Z')

    const [url, opts] = vi.mocked(global.fetch).mock.calls[0]!
    expect(String(url)).toContain(
      'mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews/abc/reply',
    )
    expect(opts?.method).toBe('PUT')
    expect(opts?.headers).toEqual(
      expect.objectContaining({
        Authorization: 'Bearer ya29.test',
        'Content-Type': 'application/json',
      }),
    )
    const body = JSON.parse(opts?.body as string)
    expect(body.comment).toBe('Thank you for your kind words!')
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    )

    await expect(
      replyToReview({
        accessToken: 'bad',
        reviewName: 'accounts/123/locations/456/reviews/abc',
        comment: 'Thanks!',
      }),
    ).rejects.toThrow('GBP Reply API error (404)')
  })
})

describe('deleteReply', () => {
  it('sends DELETE request', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 200 }),
    )

    await deleteReply({
      accessToken: 'ya29.test',
      reviewName: 'accounts/123/locations/456/reviews/abc',
    })

    const [url, opts] = vi.mocked(global.fetch).mock.calls[0]!
    expect(String(url)).toContain(
      'mybusiness.googleapis.com/v4/accounts/123/locations/456/reviews/abc/reply',
    )
    expect(opts?.method).toBe('DELETE')
    expect(opts?.headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer ya29.test' }),
    )
  })

  it('throws on API error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Server Error', { status: 500 }),
    )

    await expect(
      deleteReply({
        accessToken: 'bad',
        reviewName: 'accounts/123/locations/456/reviews/abc',
      }),
    ).rejects.toThrow('GBP Delete Reply API error (500)')
  })
})
