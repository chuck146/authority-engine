import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { VideoThumbnailInput } from '@/types/media'
import { buildBrandColorInstruction, buildCompanyContext, IMAGE_DIMENSIONS } from './shared'

export function buildVideoThumbnailPrompt(input: VideoThumbnailInput, org: OrgContext): string {
  const dim = IMAGE_DIMENSIONS.video_thumbnail
  const style = input.style ?? 'photorealistic'

  return [
    `Generate a ${dim.width}x${dim.height} video thumbnail image.`,
    buildCompanyContext(org),
    `Topic: "${input.topic}".`,
    `Style: ${style}, eye-catching, high contrast, cinematic feel.`,
    'The image should work well as a video thumbnail — bold, clear subject, visually striking.',
    'Show a compelling scene related to the topic that makes viewers want to click and watch.',
    'Do NOT include any text, logos, play buttons, or watermarks in the image.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join('\n')
}
