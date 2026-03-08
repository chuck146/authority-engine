import { z } from 'zod'
import { callClaude, parseClaudeJsonResponse } from './claude'
import {
  buildGbpPostPrompt,
  buildInstagramPostPrompt,
  buildFacebookPostPrompt,
} from '@/packages/ai/prompts/social'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { GenerateSocialPostRequest, SocialPostContent } from '@/types/social'

const socialPostContentSchema = z.object({
  body: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  cta_type: z.string().optional().nullable(),
  cta_url: z.string().optional().nullable(),
  image_prompt: z.string().optional().nullable(),
})

export async function generateSocialPost(
  input: GenerateSocialPostRequest,
  orgContext: OrgContext,
): Promise<SocialPostContent> {
  let prompt: { system: string; user: string }

  switch (input.platform) {
    case 'gbp':
      prompt = buildGbpPostPrompt(input, orgContext)
      break
    case 'instagram':
      prompt = buildInstagramPostPrompt(input, orgContext)
      break
    case 'facebook':
      prompt = buildFacebookPostPrompt(input, orgContext)
      break
  }

  const rawResponse = await callClaude({
    system: prompt.system,
    user: prompt.user,
    maxTokens: 1024,
    temperature: 0.8,
  })

  const parsed = parseClaudeJsonResponse(rawResponse)
  const validated = socialPostContentSchema.parse(parsed)

  return {
    body: validated.body,
    hashtags: validated.hashtags,
    cta_type: validated.cta_type ?? undefined,
    cta_url: validated.cta_url ?? undefined,
    image_prompt: validated.image_prompt ?? undefined,
  }
}
