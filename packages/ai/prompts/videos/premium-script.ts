import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { PremiumReelInput } from '@/types/video'
import { buildCompanyContext, buildBrandColorInstruction } from './shared'

export function buildPremiumScriptPrompt(
  input: PremiumReelInput,
  orgContext: OrgContext,
): { system: string; user: string } {
  const system = `You are a video script writer for home improvement companies. You create multi-scene video scripts designed for cinematic AI video generation.

Output ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "title": "Short video title",
  "scenes": [
    {
      "sceneNumber": 1,
      "description": "Detailed visual scene description for AI video generation. Include camera movement, lighting, composition. 2-4 sentences.",
      "audio": "Audio description: ambient sounds, music mood, any dialogue. 1-2 sentences.",
      "imagePrompt": "A photorealistic image prompt for generating a starting frame. Include specific visual details, colors, setting. 1-2 sentences.",
      "durationHint": 8
    }
  ],
  "narration": "Optional voiceover narration text for the entire video."
}

Rules:
- Each scene description must work as a standalone Veo prompt (Visual format)
- Each audio field must work as a standalone Veo audio prompt
- Each imagePrompt must describe a 1280x720 photorealistic image for Nano Banana 2
- durationHint should be 6-8 seconds per scene
- Scenes should flow together as a cohesive video story
- ${buildBrandColorInstruction(orgContext)}
- ${buildCompanyContext(orgContext)}`

  const audienceLine = input.targetAudience
    ? `Target audience: ${input.targetAudience}`
    : 'Target audience: homeowners considering home improvement services'

  const user = `Create a ${input.sceneCount}-scene ${input.style} video script.

Topic: ${input.topic}
Style: ${input.style}
${audienceLine}
Company: ${orgContext.orgName}${orgContext.branding?.tagline ? ` — "${orgContext.branding.tagline}"` : ''}
${orgContext.domain ? `Website: ${orgContext.domain}` : ''}

Generate exactly ${input.sceneCount} scenes. Each scene should be 6-8 seconds of cinematic content.`

  return { system, user }
}
