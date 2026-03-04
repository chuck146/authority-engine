import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreate = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  }
})

// Import after mock setup
const { callClaude } = await import('../claude')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('callClaude', () => {
  it('calls messages.create with correct params', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'Hello from Claude' }],
    })

    await callClaude({ system: 'You are an expert.', user: 'Write something.' })

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      temperature: 0.7,
      system: 'You are an expert.',
      messages: [{ role: 'user', content: 'Write something.' }],
    })
  })

  it('extracts text from response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: '{"headline":"Test"}' }],
    })

    const result = await callClaude({ system: 'sys', user: 'usr' })
    expect(result).toBe('{"headline":"Test"}')
  })

  it('throws when no text block in response', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'tool_use', id: '1', name: 'test', input: {} }],
    })

    await expect(callClaude({ system: 'sys', user: 'usr' })).rejects.toThrow(
      'Claude returned no text content',
    )
  })

  it('uses provided maxTokens and temperature', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'ok' }],
    })

    await callClaude({ system: 'sys', user: 'usr', maxTokens: 2000, temperature: 0.3 })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 2000,
        temperature: 0.3,
      }),
    )
  })

  it('defaults maxTokens to 4096 and temperature to 0.7', async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'ok' }],
    })

    await callClaude({ system: 'sys', user: 'usr' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 4096,
        temperature: 0.7,
      }),
    )
  })
})
