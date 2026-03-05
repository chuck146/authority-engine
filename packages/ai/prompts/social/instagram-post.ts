import type { InstagramPostInput } from '@/types/social'
import { buildBrandVoiceBlock, type OrgContext, type PromptPair } from '../content/shared'
import { PLATFORM_LIMITS, SOCIAL_POST_FORMAT_INSTRUCTION } from './shared'

export function buildInstagramPostPrompt(input: InstagramPostInput, org: OrgContext): PromptPair {
  const keywordsInstruction = input.keywords?.length
    ? `Incorporate these keywords naturally: ${input.keywords.join(', ')}`
    : 'Include relevant industry and local keywords naturally.'

  const moodContext = {
    inspiring:
      'Write in an inspiring, aspirational tone that makes homeowners dream about their next project.',
    educational:
      'Write educational content that positions the company as an expert — share tips, tricks, or industry knowledge.',
    promotional:
      'Write promotional content highlighting services, quality, and value — without being too salesy.',
    'behind-the-scenes':
      'Write a behind-the-scenes post that humanizes the brand — show the team, process, or craft.',
  }[input.mood]

  return {
    system: `You are an expert social media marketer writing Instagram captions for a home improvement company. Instagram content must be visually engaging, emotionally resonant, and optimized for discovery through strategic hashtag usage.

Tone: ${input.tone}
${buildBrandVoiceBlock(org)}

Guidelines:
- ${moodContext}
- Maximum ${PLATFORM_LIMITS.instagram} characters for the caption
- Use line breaks for readability (\\n\\n between paragraphs)
- Include strategic emoji usage (2-5 relevant emojis)
- Generate exactly ${input.hashtagCount} hashtags — mix of broad (#painting), niche (#homeimprovement), and local (#njpainter)
- Start with a hook that stops the scroll
- End with a call-to-action (comment, DM, link in bio, etc.)
- Write for engagement — ask a question or encourage saves/shares`,
    user: `Write an Instagram caption about: "${input.topic}"

${keywordsInstruction}

${SOCIAL_POST_FORMAT_INSTRUCTION}`,
  }
}
