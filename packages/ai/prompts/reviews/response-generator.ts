import { buildBrandVoiceBlock, type OrgContext, type PromptPair } from '../content/shared'
import type { GenerateResponseRequest } from '@/types/reviews'

type ReviewContext = {
  reviewerName: string
  rating: number
  reviewText: string | null
  platform: string
}

const REVIEW_RESPONSE_FORMAT_INSTRUCTION = `
Return your response as valid JSON matching this exact structure:
{
  "response_text": "string - the review response ready to post",
  "sentiment": "string - one of: positive, neutral, negative, mixed",
  "sentiment_score": "number - between -1.0 (very negative) and 1.0 (very positive)",
  "key_themes": ["string array - 2-5 key themes mentioned in the review"]
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation, no preamble.
`

export function buildReviewResponsePrompt(
  input: GenerateResponseRequest,
  review: ReviewContext,
  org: OrgContext,
): PromptPair {
  const toneGuidelines: Record<string, string> = {
    appreciative:
      'Express genuine gratitude and warmth. Highlight specific things the reviewer mentioned. Make them feel valued.',
    empathetic:
      'Acknowledge their experience with compassion. Show understanding of any frustration. Focus on resolution and improvement.',
    professional:
      'Maintain a courteous, business-appropriate tone. Be helpful and solution-oriented without being overly casual.',
    friendly:
      'Use a warm, conversational tone. Be personable and approachable while maintaining professionalism.',
  }

  const ratingContext =
    review.rating >= 4
      ? 'This is a positive review. Express gratitude and reinforce the positive experience.'
      : review.rating === 3
        ? 'This is a mixed/neutral review. Acknowledge the feedback and express commitment to improvement.'
        : 'This is a negative review. Address concerns empathetically, apologize where appropriate, and offer to resolve the issue offline.'

  const promotionInstruction = input.includePromotion
    ? 'You may include a brief, natural mention of a current service or offer — but keep it subtle and not the focus of the response.'
    : 'Do NOT include any promotional content or mentions of services/offers.'

  const customInstruction = input.customInstructions
    ? `\nAdditional instructions: ${input.customInstructions}`
    : ''

  return {
    system: `You are an expert reputation manager writing review responses for a home improvement company. Your responses appear publicly on review platforms and directly impact the company's online reputation and local SEO.

Tone: ${input.tone}
${toneGuidelines[input.tone]}

${buildBrandVoiceBlock(org)}

Guidelines:
- Maximum ${input.maxLength} characters for the response
- ${ratingContext}
- Address the reviewer by name (${review.reviewerName})
- Reference specific details from their review when available
- ${promotionInstruction}
- Sign off naturally (e.g., "— The ${org.orgName} Team" or similar)
- Never argue with the reviewer or be defensive
- For negative reviews, always offer to continue the conversation offline
- Keep it concise — 2-4 short paragraphs maximum${customInstruction}`,
    user: `Write a response to this ${review.platform} review:

Reviewer: ${review.reviewerName}
Rating: ${review.rating}/5 stars
Review: ${review.reviewText ?? '(No text provided — rating only)'}

Also analyze the sentiment of this review.

${REVIEW_RESPONSE_FORMAT_INSTRUCTION}`,
  }
}
