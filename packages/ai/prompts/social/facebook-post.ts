import type { FacebookPostInput } from '@/types/social'
import { buildBrandVoiceBlock, type OrgContext, type PromptPair } from '../content/shared'
import { SOCIAL_POST_FORMAT_INSTRUCTION } from './shared'

export function buildFacebookPostPrompt(input: FacebookPostInput, org: OrgContext): PromptPair {
  const keywordsInstruction = input.keywords?.length
    ? `Incorporate these keywords naturally: ${input.keywords.join(', ')}`
    : 'Include relevant community and local keywords naturally.'

  const linkInstruction = input.linkUrl
    ? `Include this link naturally in the post: ${input.linkUrl}`
    : ''

  return {
    system: `You are an expert social media marketer writing Facebook posts for a home improvement company. Facebook posts should be conversational, community-focused, and encourage engagement through comments and shares.

Tone: ${input.tone}
${buildBrandVoiceBlock(org)}

Guidelines:
- Write a longer-form, conversational Facebook post (3-6 paragraphs)
- Focus on community engagement — tell a story, share expertise, or celebrate a win
- Use a conversational, approachable voice
- Include 3-5 relevant hashtags (Facebook uses fewer hashtags than Instagram)
- Start with an attention-grabbing opening line
- End with a question or call-to-action to drive comments
- If sharing a link, provide context about why people should click
${linkInstruction}`,
    user: `Write a Facebook post about: "${input.topic}"

${keywordsInstruction}

${SOCIAL_POST_FORMAT_INSTRUCTION}`,
  }
}
