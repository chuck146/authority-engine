import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { ImageType } from '@/types/media'

export const IMAGE_DIMENSIONS: Record<ImageType, { width: number; height: number }> = {
  blog_thumbnail: { width: 1200, height: 630 },
  location_hero: { width: 1920, height: 1080 },
  social_graphic: { width: 1080, height: 1080 },
}

export function buildBrandColorInstruction(org: OrgContext): string {
  if (!org.branding) return ''
  const { primary, secondary, accent } = org.branding
  return `Brand colors: primary ${primary}, secondary ${secondary}, accent ${accent}. Subtly incorporate these colors where appropriate.`
}

export function buildCompanyContext(org: OrgContext): string {
  return `Company: ${org.orgName}${org.branding?.tagline ? ` — "${org.branding.tagline}"` : ''}`
}
