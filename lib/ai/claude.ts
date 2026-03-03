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
