import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { SocialGraphicInput } from '@/types/media'
import { buildBrandColorInstruction, buildCompanyContext, IMAGE_DIMENSIONS } from './shared'

export function buildSocialGraphicPrompt(input: SocialGraphicInput, org: OrgContext): string {
  const dim = IMAGE_DIMENSIONS.social_graphic
  const style = input.style ?? 'photorealistic'
  const mood = input.mood ?? 'vibrant'

  return [
    `Generate a ${dim.width}x${dim.height} social media graphic for a home improvement company.`,
    buildCompanyContext(org),
    `Message/theme: "${input.message}"`,
    `Style: ${style}, ${mood} mood.`,
    'The image should be eye-catching and engaging for Instagram or Facebook.',
    'Do NOT include any text, logos, or watermarks in the image.',
    'Focus on striking visuals related to the message — before/after, materials, craftsmanship, or interiors.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join('\n')
}
