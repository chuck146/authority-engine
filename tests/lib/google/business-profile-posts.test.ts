import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { GbpLocalPostRequest, GbpLocalPostResponse } from '@/types/gbp'

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('createLocalPost', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function getCreateLocalPost() {
    const mod = await import('@/lib/google/business-profile')
    return mod.createLocalPost
  }

  const baseOptions = {
    accessToken: 'test-token',
    locationName: 'accounts/123/locations/456',
    post: {
      languageCode: 'en',
      summary: 'Spring painting special!',
      topicType: 'STANDARD',
    } as GbpLocalPostRequest,
  }

  it('creates a local post successfully', async () => {
    const mockResponse: GbpLocalPostResponse = {
      name: 'accounts/123/locations/456/localPosts/789',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
      searchUrl: 'https://search.google.com/local/posts?q=test',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const createLocalPost = await getCreateLocalPost()
    const result = await createLocalPost(baseOptions)

    expect(result).toEqual(mockResponse)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://mybusiness.googleapis.com/v4/accounts/123/locations/456/localPosts',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(baseOptions.post),
      }),
    )
  })

  it('throws on API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: () => Promise.resolve('Forbidden'),
    })

    const createLocalPost = await getCreateLocalPost()
    await expect(createLocalPost(baseOptions)).rejects.toThrow(
      'GBP Local Posts API error (403): Forbidden',
    )
  })

  it('sends correct request body structure with CTA and media', async () => {
    const postWithExtras: GbpLocalPostRequest = {
      languageCode: 'en',
      summary: 'Get a free estimate today!',
      topicType: 'OFFER',
      callToAction: { actionType: 'BOOK', url: 'https://example.com/book' },
      media: [{ mediaFormat: 'PHOTO', sourceUrl: 'https://example.com/image.jpg' }],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          name: 'accounts/123/locations/456/localPosts/999',
          state: 'LIVE',
          createTime: '2026-03-18T10:00:00Z',
          updateTime: '2026-03-18T10:00:00Z',
        }),
    })

    const createLocalPost = await getCreateLocalPost()
    await createLocalPost({ ...baseOptions, post: postWithExtras })

    const callBody = JSON.parse(mockFetch.mock.calls[0]![1].body)
    expect(callBody.callToAction).toEqual({ actionType: 'BOOK', url: 'https://example.com/book' })
    expect(callBody.media).toEqual([
      { mediaFormat: 'PHOTO', sourceUrl: 'https://example.com/image.jpg' },
    ])
    expect(callBody.topicType).toBe('OFFER')
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const createLocalPost = await getCreateLocalPost()
    await expect(createLocalPost(baseOptions)).rejects.toThrow('Network error')
  })
})
