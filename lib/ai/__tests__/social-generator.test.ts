import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext } from '@/tests/factories'

// --- Mocks ---

const mockCallClaude = vi.fn()

vi.mock('../claude', async (importActual) => {
  const actual = await importActual<typeof import('../claude')>()
  return {
    ...actual,
    callClaude: (...args: unknown[]) => mockCallClaude(...args),
  }
})

vi.mock('@/packages/ai/prompts/social', () => ({
  buildGbpPostPrompt: vi.fn(() => ({ system: 'gbp system', user: 'gbp user' })),
  buildInstagramPostPrompt: vi.fn(() => ({ system: 'ig system', user: 'ig user' })),
  buildFacebookPostPrompt: vi.fn(() => ({ system: 'fb system', user: 'fb user' })),
}))

const { generateSocialPost } = await import('../social-generator')

const defaultOrg = buildOrgContext()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateSocialPost', () => {
  const validResponse = JSON.stringify({
    body: 'Great post content here!',
    hashtags: ['painting', 'home'],
    cta_type: 'LEARN_MORE',
    cta_url: 'https://example.com',
    image_prompt: 'A beautiful painted room',
  })

  it('generates GBP post successfully', async () => {
    mockCallClaude.mockResolvedValue(validResponse)

    const result = await generateSocialPost(
      {
        platform: 'gbp',
        topic: 'Spring special',
        tone: 'professional',
        postType: 'update',
        generateImage: false,
      },
      defaultOrg,
    )

    expect(result.body).toBe('Great post content here!')
    expect(result.hashtags).toEqual(['painting', 'home'])
    expect(result.cta_type).toBe('LEARN_MORE')
  })

  it('generates Instagram post successfully', async () => {
    mockCallClaude.mockResolvedValue(validResponse)

    const result = await generateSocialPost(
      {
        platform: 'instagram',
        topic: 'Project reveal',
        tone: 'friendly',
        mood: 'inspiring',
        hashtagCount: 15,
        generateImage: false,
      },
      defaultOrg,
    )

    expect(result.body).toBe('Great post content here!')
    expect(result.hashtags).toHaveLength(2)
  })

  it('generates Facebook post successfully', async () => {
    mockCallClaude.mockResolvedValue(validResponse)

    const result = await generateSocialPost(
      { platform: 'facebook', topic: 'Community update', tone: 'friendly', generateImage: false },
      defaultOrg,
    )

    expect(result.body).toBe('Great post content here!')
  })

  it('uses lower maxTokens and higher temperature for social posts', async () => {
    mockCallClaude.mockResolvedValue(validResponse)

    await generateSocialPost(
      {
        platform: 'gbp',
        topic: 'Test',
        tone: 'professional',
        postType: 'update',
        generateImage: false,
      },
      defaultOrg,
    )

    const callArgs = mockCallClaude.mock.calls[0]![0] as { maxTokens: number; temperature: number }
    expect(callArgs.maxTokens).toBe(1024)
    expect(callArgs.temperature).toBe(0.8)
  })

  it('handles markdown-wrapped JSON response', async () => {
    mockCallClaude.mockResolvedValue('```json\n' + validResponse + '\n```')

    const result = await generateSocialPost(
      {
        platform: 'gbp',
        topic: 'Test',
        tone: 'professional',
        postType: 'update',
        generateImage: false,
      },
      defaultOrg,
    )

    expect(result.body).toBe('Great post content here!')
  })

  it('handles response with null optional fields', async () => {
    mockCallClaude.mockResolvedValue(
      JSON.stringify({
        body: 'Simple post',
        hashtags: [],
        cta_type: null,
        cta_url: null,
        image_prompt: null,
      }),
    )

    const result = await generateSocialPost(
      {
        platform: 'gbp',
        topic: 'Test',
        tone: 'professional',
        postType: 'update',
        generateImage: false,
      },
      defaultOrg,
    )

    expect(result.body).toBe('Simple post')
    expect(result.cta_type).toBeUndefined()
    expect(result.cta_url).toBeUndefined()
  })

  it('throws on invalid JSON response', async () => {
    mockCallClaude.mockResolvedValue('This is not JSON')

    await expect(
      generateSocialPost(
        {
          platform: 'gbp',
          topic: 'Test',
          tone: 'professional',
          postType: 'update',
          generateImage: false,
        },
        defaultOrg,
      ),
    ).rejects.toThrow('Failed to parse Claude response as JSON')
  })

  it('throws on missing required body field', async () => {
    mockCallClaude.mockResolvedValue(
      JSON.stringify({
        hashtags: ['test'],
      }),
    )

    await expect(
      generateSocialPost(
        {
          platform: 'gbp',
          topic: 'Test',
          tone: 'professional',
          postType: 'update',
          generateImage: false,
        },
        defaultOrg,
      ),
    ).rejects.toThrow()
  })
})
