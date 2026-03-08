import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildOrgContext, buildStructuredContent } from '@/tests/factories'
import { mockClaudeJsonResponse, mockClaudeJsonWithFences } from '@/tests/mocks/claude'
import type { GenerateContentRequest } from '@/types/content'

const mockCallClaude = vi.fn()

vi.mock('../claude', async (importActual) => {
  const actual = await importActual<typeof import('../claude')>()
  return {
    ...actual,
    callClaude: (...args: unknown[]) => mockCallClaude(...args),
  }
})

// Import after mock
const { generateContent } = await import('../content-generator')

const orgContext = buildOrgContext()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('generateContent', () => {
  it('routes service_page to correct prompt builder', async () => {
    mockCallClaude.mockResolvedValueOnce(mockClaudeJsonResponse())

    const input: GenerateContentRequest = {
      contentType: 'service_page',
      serviceName: 'Interior Painting',
      tone: 'professional',
    }

    await generateContent(input, orgContext)

    expect(mockCallClaude).toHaveBeenCalledOnce()
    const callArgs = mockCallClaude.mock.calls[0]![0] as { system: string; user: string }
    expect(callArgs.system).toContain('professional')
    expect(callArgs.user).toContain('Interior Painting')
  })

  it('routes location_page to correct prompt builder', async () => {
    mockCallClaude.mockResolvedValueOnce(mockClaudeJsonResponse())

    const input: GenerateContentRequest = {
      contentType: 'location_page',
      city: 'Summit',
      state: 'NJ',
      serviceName: 'Painting',
      tone: 'professional',
    }

    await generateContent(input, orgContext)

    const callArgs = mockCallClaude.mock.calls[0]![0] as { system: string; user: string }
    expect(callArgs.system).toContain('Summit')
  })

  it('routes blog_post to correct prompt builder', async () => {
    mockCallClaude.mockResolvedValueOnce(mockClaudeJsonResponse())

    const input: GenerateContentRequest = {
      contentType: 'blog_post',
      topic: 'Choosing Paint Colors',
      tone: 'friendly',
      targetWordCount: 800,
    }

    await generateContent(input, orgContext)

    const callArgs = mockCallClaude.mock.calls[0]![0] as { system: string; user: string }
    expect(callArgs.system).toContain('800')
  })

  it('parses clean JSON response', async () => {
    mockCallClaude.mockResolvedValueOnce(mockClaudeJsonResponse())

    const result = await generateContent(
      { contentType: 'service_page', serviceName: 'Painting', tone: 'professional' },
      orgContext,
    )

    expect(result.headline).toBe('Professional Interior Painting Services')
    expect(result.sections).toHaveLength(2)
  })

  it('parses JSON wrapped in markdown fences', async () => {
    mockCallClaude.mockResolvedValueOnce(mockClaudeJsonWithFences())

    const result = await generateContent(
      { contentType: 'service_page', serviceName: 'Painting', tone: 'professional' },
      orgContext,
    )

    expect(result.headline).toBe('Professional Interior Painting Services')
  })

  it('throws on invalid JSON response', async () => {
    mockCallClaude.mockResolvedValueOnce('This is not JSON at all')

    await expect(
      generateContent(
        { contentType: 'service_page', serviceName: 'Painting', tone: 'professional' },
        orgContext,
      ),
    ).rejects.toThrow('Failed to parse Claude response as JSON')
  })

  it('throws on valid JSON that fails Zod validation', async () => {
    mockCallClaude.mockResolvedValueOnce(JSON.stringify({ headline: 'only headline' }))

    await expect(
      generateContent(
        { contentType: 'service_page', serviceName: 'Painting', tone: 'professional' },
        orgContext,
      ),
    ).rejects.toThrow()
  })

  it('returns validated StructuredContent shape', async () => {
    const expected = buildStructuredContent()
    mockCallClaude.mockResolvedValueOnce(JSON.stringify(expected))

    const result = await generateContent(
      { contentType: 'service_page', serviceName: 'Painting', tone: 'professional' },
      orgContext,
    )

    expect(result).toEqual(expected)
  })
})
