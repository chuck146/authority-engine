import type { GbpPostInput } from '@/types/social'
import { buildBrandVoiceBlock, type OrgContext, type PromptPair } from '../content/shared'
import { PLATFORM_LIMITS, SOCIAL_POST_FORMAT_INSTRUCTION } from './shared'

export function buildGbpPostPrompt(input: GbpPostInput, org: OrgContext): PromptPair {
  const keywordsInstruction = input.keywords?.length
    ? `Incorporate these keywords naturally: ${input.keywords.join(', ')}`
    : 'Include relevant local SEO keywords naturally.'

  const postTypeContext = {
    update: 'a general business update post',
    event: 'an event announcement post',
    offer: 'a special offer/promotion post',
  }[input.postType]

  const ctaInstruction = input.ctaType
    ? `Include a ${input.ctaType} call-to-action. CTA URL: ${input.ctaUrl ?? org.domain ?? ''}`
    : `Suggest an appropriate CTA type (BOOK, ORDER, LEARN_MORE, SIGN_UP, or CALL) for this post. CTA URL: ${org.domain ?? ''}`

  return {
    system: `You are an expert local business marketer writing Google Business Profile posts for a home improvement company. GBP posts appear in Google Search and Maps results. They must be concise, locally relevant, and drive action.

Tone: ${input.tone}
${buildBrandVoiceBlock(org)}

Guidelines:
- Write ${postTypeContext}
- Maximum ${PLATFORM_LIMITS.gbp} characters for the body
- Focus on local relevance and service expertise
- Include a clear call-to-action
- Use professional language appropriate for Google's business platform
- Do NOT use hashtags (GBP doesn't support them) — return an empty array for hashtags
- Keep it concise — 2-4 short paragraphs maximum
${ctaInstruction}`,
    user: `Write a Google Business Profile post about: "${input.topic}"

${keywordsInstruction}

${SOCIAL_POST_FORMAT_INSTRUCTION}`,
  }
}
