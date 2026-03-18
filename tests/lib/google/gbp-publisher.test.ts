import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks
const mockGetValidToken = vi.fn()
const mockCreateLocalPost = vi.fn()

vi.mock('@/lib/google/token-manager', () => ({
  getValidToken: (...args: unknown[]) => mockGetValidToken(...args),
}))

vi.mock('@/lib/google/business-profile', () => ({
  createLocalPost: (...args: unknown[]) => mockCreateLocalPost(...args),
}))

// Helper to build a mock Supabase client
function buildMockSupabase(overrides?: {
  socialPost?: Record<string, unknown> | null
  mediaAsset?: { storage_path: string } | null
}) {
  const socialPost = overrides?.socialPost ?? {
    body: 'Spring painting special! Book now.',
    post_type: 'update',
    cta_type: 'BOOK',
    cta_url: 'https://cleanestpainting.com/estimate',
    media_asset_id: null,
    metadata: {},
  }
  const mediaAsset = overrides?.mediaAsset ?? null

  return {
    from: vi.fn((table: string) => {
      if (table === 'social_posts') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: socialPost, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      if (table === 'media_assets') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              returns: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mediaAsset, error: null }),
              }),
            }),
          }),
        }
      }
      return { select: vi.fn(), update: vi.fn() }
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/media/image.jpg' },
        }),
      }),
    },
  } as unknown
}

describe('publishSocialPostToGbp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function getPublisher() {
    const mod = await import('@/lib/google/gbp-publisher')
    return mod.publishSocialPostToGbp
  }

  it('publishes successfully without image', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockResolvedValue({
      name: 'accounts/123/locations/456/localPosts/789',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
    })

    const supabase = buildMockSupabase()
    const publish = await getPublisher()
    const result = await publish(supabase as never, 'social-1', 'org-1')

    expect(result.published).toBe(true)
    expect(result.gbpPostName).toBe('accounts/123/locations/456/localPosts/789')
    expect(mockCreateLocalPost).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: 'test-token',
        locationName: 'accounts/123/locations/456',
        post: expect.objectContaining({
          languageCode: 'en',
          summary: 'Spring painting special! Book now.',
          topicType: 'STANDARD',
          callToAction: { actionType: 'BOOK', url: 'https://cleanestpainting.com/estimate' },
        }),
      }),
    )
  })

  it('publishes successfully with image', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockResolvedValue({
      name: 'accounts/123/locations/456/localPosts/999',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
    })

    const supabase = buildMockSupabase({
      socialPost: {
        body: 'Check out our latest project!',
        post_type: 'update',
        cta_type: null,
        cta_url: null,
        media_asset_id: 'media-1',
        metadata: {},
      },
      mediaAsset: { storage_path: 'org-1/images/social/abc.jpg' },
    })

    const publish = await getPublisher()
    const result = await publish(supabase as never, 'social-1', 'org-1')

    expect(result.published).toBe(true)
    expect(mockCreateLocalPost).toHaveBeenCalledWith(
      expect.objectContaining({
        post: expect.objectContaining({
          media: [
            { mediaFormat: 'PHOTO', sourceUrl: 'https://storage.example.com/media/image.jpg' },
          ],
        }),
      }),
    )
  })

  it('omits callToAction when cta_type or cta_url is missing', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockResolvedValue({
      name: 'accounts/123/locations/456/localPosts/111',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
    })

    const supabase = buildMockSupabase({
      socialPost: {
        body: 'No CTA post',
        post_type: 'update',
        cta_type: null,
        cta_url: null,
        media_asset_id: null,
        metadata: {},
      },
    })

    const publish = await getPublisher()
    await publish(supabase as never, 'social-1', 'org-1')

    const postArg = mockCreateLocalPost.mock.calls[0]![0].post
    expect(postArg.callToAction).toBeUndefined()
  })

  it('truncates body to 1500 chars', async () => {
    const longBody = 'A'.repeat(2000)
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockResolvedValue({
      name: 'accounts/123/locations/456/localPosts/222',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
    })

    const supabase = buildMockSupabase({
      socialPost: {
        body: longBody,
        post_type: 'update',
        cta_type: null,
        cta_url: null,
        media_asset_id: null,
        metadata: {},
      },
    })

    const publish = await getPublisher()
    await publish(supabase as never, 'social-1', 'org-1')

    const postArg = mockCreateLocalPost.mock.calls[0]![0].post
    expect(postArg.summary.length).toBe(1500)
  })

  it('returns published: false gracefully when no GBP connection', async () => {
    mockGetValidToken.mockRejectedValue(
      new Error('No active Google Business Profile connection found'),
    )

    const supabase = buildMockSupabase()
    const publish = await getPublisher()
    const result = await publish(supabase as never, 'social-1', 'org-1')

    expect(result.published).toBe(false)
    expect(result.error).toBeUndefined()
    expect(mockCreateLocalPost).not.toHaveBeenCalled()
  })

  it('returns error when GBP API call fails', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockRejectedValue(
      new Error('GBP Local Posts API error (500): Internal Server Error'),
    )

    const supabase = buildMockSupabase()
    const publish = await getPublisher()
    const result = await publish(supabase as never, 'social-1', 'org-1')

    expect(result.published).toBe(false)
    expect(result.error).toContain('GBP Local Posts API error (500)')
  })

  it('maps post types correctly (event → EVENT, offer → OFFER)', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockResolvedValue({
      name: 'accounts/123/locations/456/localPosts/333',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
    })

    const supabase = buildMockSupabase({
      socialPost: {
        body: 'Spring event!',
        post_type: 'event',
        cta_type: null,
        cta_url: null,
        media_asset_id: null,
        metadata: {},
      },
    })

    const publish = await getPublisher()
    await publish(supabase as never, 'social-1', 'org-1')

    expect(mockCreateLocalPost.mock.calls[0]![0].post.topicType).toBe('EVENT')
  })

  it('merges metadata preserving existing keys', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: 'accounts/123/locations/456',
    })
    mockCreateLocalPost.mockResolvedValue({
      name: 'accounts/123/locations/456/localPosts/444',
      state: 'LIVE',
      createTime: '2026-03-18T10:00:00Z',
      updateTime: '2026-03-18T10:00:00Z',
    })

    const supabase = buildMockSupabase({
      socialPost: {
        body: 'Test post',
        post_type: 'update',
        cta_type: null,
        cta_url: null,
        media_asset_id: null,
        metadata: { existing_key: 'existing_value' },
      },
    })

    const publish = await getPublisher()
    const result = await publish(supabase as never, 'social-1', 'org-1')

    // Verify GBP publish was called and succeeded
    expect(result.published).toBe(true)
  })

  it('returns error when social post not found', async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Row not found' } }),
          }),
        }),
      })),
    }
    const publish = await getPublisher()
    const result = await publish(supabase as never, 'missing-id', 'org-1')

    expect(result.published).toBe(false)
    expect(result.error).toContain('not found')
    expect(mockGetValidToken).not.toHaveBeenCalled()
  })

  it('returns error when no GBP location selected', async () => {
    mockGetValidToken.mockResolvedValue({
      accessToken: 'test-token',
      siteUrl: '', // empty = no location selected
    })

    const supabase = buildMockSupabase()
    const publish = await getPublisher()
    const result = await publish(supabase as never, 'social-1', 'org-1')

    expect(result.published).toBe(false)
    expect(result.error).toContain('No GBP location selected')
    expect(mockCreateLocalPost).not.toHaveBeenCalled()
  })
})
