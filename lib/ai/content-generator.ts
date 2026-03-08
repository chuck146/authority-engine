import { callClaude, parseClaudeJsonResponse } from './claude'
import {
  buildServicePagePrompt,
  buildLocationPagePrompt,
  buildBlogPostPrompt,
  type OrgContext,
} from '@/packages/ai/prompts/content'
import {
  structuredContentSchema,
  type GenerateContentRequest,
  type StructuredContent,
} from '@/types/content'

export async function generateContent(
  input: GenerateContentRequest,
  orgContext: OrgContext,
): Promise<StructuredContent> {
  let prompt: { system: string; user: string }

  switch (input.contentType) {
    case 'service_page':
      prompt = buildServicePagePrompt(input, orgContext)
      break
    case 'location_page':
      prompt = buildLocationPagePrompt(input, orgContext)
      break
    case 'blog_post':
      prompt = buildBlogPostPrompt(input, orgContext)
      break
  }

  const rawResponse = await callClaude({
    system: prompt.system,
    user: prompt.user,
    maxTokens: 4096,
    temperature: 0.7,
  })

  const parsed = parseClaudeJsonResponse(rawResponse)
  const validated = structuredContentSchema.parse(parsed)

  return validated
}
