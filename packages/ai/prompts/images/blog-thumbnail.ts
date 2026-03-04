import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { BlogThumbnailInput } from '@/types/media'
import { buildBrandColorInstruction, buildCompanyContext, IMAGE_DIMENSIONS } from './shared'

export function buildBlogThumbnailPrompt(input: BlogThumbnailInput, org: OrgContext): string {
  const dim = IMAGE_DIMENSIONS.blog_thumbnail
  const style = input.style ?? 'photorealistic'
  const mood = input.mood ?? 'warm'

  return [
    `Generate a ${dim.width}x${dim.height} blog thumbnail image for a home improvement company.`,
    buildCompanyContext(org),
    `Topic: "${input.topic}"`,
    `Style: ${style}, ${mood} mood.`,
    'The image should be visually compelling and work well as a blog header.',
    'Do NOT include any text, logos, or watermarks in the image.',
    'Focus on high-quality imagery related to the topic — tools, materials, finished projects, or homes.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join('\n')
}
