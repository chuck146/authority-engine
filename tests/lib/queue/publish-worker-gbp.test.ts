import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPublishSocialPostToGbp = vi.fn()

vi.mock('@/lib/google/gbp-publisher', () => ({
  publishSocialPostToGbp: (...args: unknown[]) => mockPublishSocialPostToGbp(...args),
}))

// Build a mock Supabase client that tracks calls
function buildMockSupabase(options?: {
  calendarEntry?: { id: string; status: string } | null
  socialPost?: { platform: string; organization_id: string } | null
}) {
  const calendarEntry = options?.calendarEntry ?? { id: 'cal-1', status: 'scheduled' }
  const socialPost = options?.socialPost ?? { platform: 'gbp', organization_id: 'org-1' }

  const updateStatusCalls: Array<{ table: string; data: Record<string, unknown>; id: string }> = []

  return {
    client: {
      from: vi.fn((table: string) => {
        if (table === 'content_calendar') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: calendarEntry, error: null }),
              }),
            }),
            update: vi.fn((data: Record<string, unknown>) => ({
              eq: vi.fn((col: string, val: string) => {
                updateStatusCalls.push({ table, data, id: val })
                return Promise.resolve({ error: null })
              }),
            })),
          }
        }
        if (table === 'social_posts') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: socialPost, error: null }),
              }),
            }),
            update: vi.fn((data: Record<string, unknown>) => ({
              eq: vi.fn(() => {
                updateStatusCalls.push({ table, data, id: 'social-1' })
                return Promise.resolve({ error: null })
              }),
            })),
          }
        }
        // Fallback for other tables
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          update: vi.fn((data: Record<string, unknown>) => ({
            eq: vi.fn(() => {
              updateStatusCalls.push({ table, data, id: 'unknown' })
              return Promise.resolve({ error: null })
            }),
          })),
        }
      }),
    },
    updateStatusCalls,
  }
}

describe('publishCalendarEntry — GBP social posts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function getPublishCalendarEntry() {
    const mod = await import('@/lib/queue/publish-worker')
    return mod.publishCalendarEntry
  }

  it('publishes GBP social post to Google successfully', async () => {
    mockPublishSocialPostToGbp.mockResolvedValue({
      published: true,
      gbpPostName: 'accounts/123/locations/456/localPosts/789',
    })

    const { client } = buildMockSupabase()
    const publishCalendarEntry = await getPublishCalendarEntry()

    await publishCalendarEntry(client as never, {
      id: 'cal-1',
      content_type: 'social_post',
      content_id: 'social-1',
    })

    expect(mockPublishSocialPostToGbp).toHaveBeenCalledWith(client, 'social-1', 'org-1')
  })

  it('still marks published internally when no GBP connection', async () => {
    mockPublishSocialPostToGbp.mockResolvedValue({ published: false })

    const { client } = buildMockSupabase()
    const publishCalendarEntry = await getPublishCalendarEntry()

    // Should not throw — just publishes internally
    await publishCalendarEntry(client as never, {
      id: 'cal-1',
      content_type: 'social_post',
      content_id: 'social-1',
    })

    expect(mockPublishSocialPostToGbp).toHaveBeenCalled()
  })

  it('marks calendar entry failed when GBP API errors', async () => {
    mockPublishSocialPostToGbp.mockResolvedValue({
      published: false,
      error: 'GBP Local Posts API error (500): Internal Server Error',
    })

    const { client } = buildMockSupabase()
    const publishCalendarEntry = await getPublishCalendarEntry()

    await expect(
      publishCalendarEntry(client as never, {
        id: 'cal-1',
        content_type: 'social_post',
        content_id: 'social-1',
      }),
    ).rejects.toThrow('GBP publish failed')
  })

  it('does not call GBP publisher for Instagram posts', async () => {
    const { client } = buildMockSupabase({
      socialPost: { platform: 'instagram', organization_id: 'org-1' },
    })
    const publishCalendarEntry = await getPublishCalendarEntry()

    await publishCalendarEntry(client as never, {
      id: 'cal-1',
      content_type: 'social_post',
      content_id: 'social-1',
    })

    expect(mockPublishSocialPostToGbp).not.toHaveBeenCalled()
  })

  it('does not call GBP publisher for Facebook posts', async () => {
    const { client } = buildMockSupabase({
      socialPost: { platform: 'facebook', organization_id: 'org-1' },
    })
    const publishCalendarEntry = await getPublishCalendarEntry()

    await publishCalendarEntry(client as never, {
      id: 'cal-1',
      content_type: 'social_post',
      content_id: 'social-1',
    })

    expect(mockPublishSocialPostToGbp).not.toHaveBeenCalled()
  })

  it('does not call GBP publisher for non-social content types', async () => {
    const { client } = buildMockSupabase()
    const publishCalendarEntry = await getPublishCalendarEntry()

    await publishCalendarEntry(client as never, {
      id: 'cal-1',
      content_type: 'service_page',
      content_id: 'page-1',
    })

    expect(mockPublishSocialPostToGbp).not.toHaveBeenCalled()
  })

  it('skips already-processed calendar entries', async () => {
    const { client } = buildMockSupabase({
      calendarEntry: { id: 'cal-1', status: 'published' },
    })
    const publishCalendarEntry = await getPublishCalendarEntry()

    await publishCalendarEntry(client as never, {
      id: 'cal-1',
      content_type: 'social_post',
      content_id: 'social-1',
    })

    // Should return early without calling GBP publisher
    expect(mockPublishSocialPostToGbp).not.toHaveBeenCalled()
  })

  it('handles missing calendar entry', async () => {
    // Build a mock where calendar entry select returns error
    const client = {
      from: vi.fn((table: string) => {
        if (table === 'content_calendar') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }),
    }

    const publishCalendarEntry = await getPublishCalendarEntry()

    await expect(
      publishCalendarEntry(client as never, {
        id: 'cal-missing',
        content_type: 'social_post',
        content_id: 'social-1',
      }),
    ).rejects.toThrow('Calendar entry cal-missing not found')
  })
})
