import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { TestimonialSceneInput } from '@/types/video'
import { buildCompanyContext } from './shared'

export function buildTestimonialScenePrompt(
  input: TestimonialSceneInput,
  org: OrgContext,
): { visual: string; audio: string } {
  const moodMap: Record<string, string> = {
    positive: 'warm, bright, and welcoming',
    grateful: 'soft, heartfelt, and cozy',
    impressed: 'dramatic, polished, and professional',
  }

  const mood = moodMap[input.sentiment] ?? 'warm, bright, and welcoming'

  const visual = [
    `A ${mood} scene of a beautifully finished home interior.`,
    'Camera slowly pans across the room, highlighting quality craftsmanship.',
    `The atmosphere reflects the sentiment: "${input.quote}" — ${input.customerName}.`,
    buildCompanyContext(org),
    'Shallow depth of field, natural light streaming through windows.',
  ]
    .filter(Boolean)
    .join(' ')

  const audio =
    'Gentle, warm piano melody with soft ambient room tone. Birdsong from outside the window creating a feeling of home satisfaction.'

  return { visual, audio }
}
