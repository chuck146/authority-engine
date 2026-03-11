import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { ServiceHeroInput } from '@/types/media'
import { buildBrandColorInstruction, buildCompanyContext, IMAGE_DIMENSIONS } from './shared'

export function buildServiceHeroPrompt(input: ServiceHeroInput, org: OrgContext): string {
  const dim = IMAGE_DIMENSIONS.service_hero
  const style = input.style ?? 'photorealistic'

  return [
    `Generate a ${dim.width}x${dim.height} hero image for a professional painting service page.`,
    buildCompanyContext(org),
    `Service: "${input.serviceName}".`,
    input.serviceDescription ? `Description: ${input.serviceDescription}` : '',
    `Style: ${style}, high-end residential, warm natural lighting.`,
    'Show professional painters at work on a beautiful home, or a stunning finished result.',
    'The scene should convey craftsmanship, attention to detail, and premium quality.',
    'Include realistic details: clean drop cloths, professional tools, crisp paint lines.',
    'Do NOT include any text, logos, or watermarks in the image.',
    buildBrandColorInstruction(org),
  ]
    .filter(Boolean)
    .join('\n')
}
