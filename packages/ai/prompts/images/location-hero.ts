import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { LocationHeroInput } from '@/types/media'
import { buildBrandColorInstruction, buildCompanyContext, IMAGE_DIMENSIONS } from './shared'

export function buildLocationHeroPrompt(input: LocationHeroInput, org: OrgContext): string {
  const dim = IMAGE_DIMENSIONS.location_hero
  const style = input.style ?? 'photorealistic'

  return [
    `Generate a ${dim.width}x${dim.height} hero image for a location-based service page.`,
    buildCompanyContext(org),
    `Service: "${input.serviceName}" in ${input.city}, ${input.state}.`,
    `Style: ${style}, warm and inviting.`,
    `Show a beautiful residential scene that feels like ${input.city}, ${input.state}.`,
    'Feature a well-maintained home exterior or neighborhood with professional craftsmanship visible.',
    'Do NOT include any text, logos, or watermarks in the image.',
    'The image should evoke trust, quality, and local pride.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join('\n')
}
