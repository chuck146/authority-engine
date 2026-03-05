import { z } from 'zod'
import { callClaude } from './claude'
import { buildReviewResponsePrompt } from '@/packages/ai/prompts/reviews'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type {
  GenerateResponseRequest,
  ReviewResponseContent,
  ReviewSentiment,
} from '@/types/reviews'

const reviewResponseContentSchema = z.object({
  response_text: z.string().min(1),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),
  sentiment_score: z.number().min(-1).max(1),
  key_themes: z.array(z.string()).default([]),
})

type ReviewContext = {
  reviewerName: string
  rating: number
  reviewText: string | null
  platform: string
}

export async function generateReviewResponse(
  input: GenerateResponseRequest,
  review: ReviewContext,
  orgContext: OrgContext,
): Promise<ReviewResponseContent> {
  const prompt = buildReviewResponsePrompt(input, review, orgContext)

  const rawResponse = await callClaude({
    system: prompt.system,
    user: prompt.user,
    maxTokens: 1024,
    temperature: 0.7,
  })

  const parsed = parseClaudeJsonResponse(rawResponse)
  const validated = reviewResponseContentSchema.parse(parsed)

  return {
    response_text: validated.response_text,
    sentiment: validated.sentiment as ReviewSentiment,
    sentiment_score: validated.sentiment_score,
    key_themes: validated.key_themes,
  }
}

function parseClaudeJsonResponse(raw: string): unknown {
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
      `Failed to parse review response as JSON. Raw response starts with: "${cleaned.slice(0, 100)}..."`,
    )
  }
}
