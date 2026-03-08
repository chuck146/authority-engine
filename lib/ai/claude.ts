import Anthropic from '@anthropic-ai/sdk'

let clientInstance: Anthropic | null = null

export function getClaudeClient(): Anthropic {
  if (!clientInstance) {
    clientInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  return clientInstance
}

export type ClaudeRequestOptions = {
  system: string
  user: string
  maxTokens?: number
  temperature?: number
}

export async function callClaude(options: ClaudeRequestOptions): Promise<string> {
  const client = getClaudeClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: options.maxTokens ?? 4096,
    temperature: options.temperature ?? 0.7,
    system: options.system,
    messages: [{ role: 'user', content: options.user }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content')
  }

  return textBlock.text
}

/**
 * Parse a Claude response that should contain JSON.
 * Handles markdown code fences that Claude sometimes wraps JSON in.
 */
export function parseClaudeJsonResponse(raw: string): unknown {
  let cleaned = raw.trim()

  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n')
    const lastFence = cleaned.lastIndexOf('```')
    if (lastFence > firstNewline) {
      cleaned = cleaned.slice(firstNewline + 1, lastFence).trim()
    }
  }

  try {
    return JSON.parse(cleaned)
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON. Raw response starts with: "${cleaned.slice(0, 100)}..."`,
    )
  }
}
