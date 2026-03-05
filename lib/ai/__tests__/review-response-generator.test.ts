import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext } from '@/tests/factories'

const mockCallClaude = vi.fn()

vi.mock('../claude', () => ({
  callClaude: (...args: unknown[]) => mockCallClaude(...args),
}))

const { generateReviewResponse } = await import('../review-response-generator')

const defaultOrgContext = buildOrgContext()

const defaultReviewContext = {
  reviewerName: 'John Smith',
  rating: 5,
  reviewText: 'Excellent work, very professional team!',
  platform: 'google',
}

const validAiResponse = JSON.stringify({
  response_text: 'Thank you, John! We appreciate your kind words.',
  sentiment: 'positive',
  sentiment_score: 0.95,
  key_themes: ['professionalism', 'quality'],
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateReviewResponse', () => {
  it('returns parsed response from Claude', async () => {
    mockCallClaude.mockResolvedValue(validAiResponse)

    const result = await generateReviewResponse(
      { tone: 'appreciative', includePromotion: false, maxLength: 500 },
      defaultReviewContext,
      defaultOrgContext,
    )

    expect(result.response_text).toBe('Thank you, John! We appreciate your kind words.')
    expect(result.sentiment).toBe('positive')
    expect(result.sentiment_score).toBe(0.95)
    expect(result.key_themes).toEqual(['professionalism', 'quality'])
  })

  it('strips markdown code fences from response', async () => {
    mockCallClaude.mockResolvedValue(`\`\`\`json\n${validAiResponse}\n\`\`\``)

    const result = await generateReviewResponse(
      { tone: 'professional', includePromotion: false, maxLength: 500 },
      defaultReviewContext,
      defaultOrgContext,
    )

    expect(result.response_text).toBe('Thank you, John! We appreciate your kind words.')
  })

  it('calls Claude with correct parameters', async () => {
    mockCallClaude.mockResolvedValue(validAiResponse)

    await generateReviewResponse(
      { tone: 'empathetic', includePromotion: true, maxLength: 300 },
      defaultReviewContext,
      defaultOrgContext,
    )

    expect(mockCallClaude).toHaveBeenCalledOnce()
    const opts = mockCallClaude.mock.calls[0]![0]
    expect(opts.maxTokens).toBe(1024)
    expect(opts.temperature).toBe(0.7)
    expect(opts.system).toContain('empathetic')
    expect(opts.system).toContain('300')
    expect(opts.user).toContain('John Smith')
    expect(opts.user).toContain('5/5 stars')
  })

  it('throws on invalid JSON response', async () => {
    mockCallClaude.mockResolvedValue('This is not JSON')

    await expect(
      generateReviewResponse(
        { tone: 'professional', includePromotion: false, maxLength: 500 },
        defaultReviewContext,
        defaultOrgContext,
      ),
    ).rejects.toThrow('Failed to parse review response as JSON')
  })

  it('throws on missing required fields', async () => {
    mockCallClaude.mockResolvedValue(JSON.stringify({ response_text: 'Hello' }))

    await expect(
      generateReviewResponse(
        { tone: 'professional', includePromotion: false, maxLength: 500 },
        defaultReviewContext,
        defaultOrgContext,
      ),
    ).rejects.toThrow()
  })

  it('handles review with no text (rating only)', async () => {
    mockCallClaude.mockResolvedValue(validAiResponse)

    await generateReviewResponse(
      { tone: 'professional', includePromotion: false, maxLength: 500 },
      { ...defaultReviewContext, reviewText: null },
      defaultOrgContext,
    )

    const opts = mockCallClaude.mock.calls[0]![0]
    expect(opts.user).toContain('No text provided')
  })
})
