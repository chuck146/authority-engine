import type { OrgContext } from '@/packages/ai/prompts/content/shared'

export function buildBrandColorInstruction(org: OrgContext): string {
  if (!org.branding) return ''
  const { primary, secondary, accent } = org.branding
  return `Brand colors: primary ${primary}, secondary ${secondary}, accent ${accent}. Subtly incorporate these colors in the environment where appropriate.`
}

export function buildCompanyContext(org: OrgContext): string {
  return `Company: ${org.orgName}${org.branding?.tagline ? ` — "${org.branding.tagline}"` : ''}.`
}

export function formatVeoPrompt(visual: string, audio: string): string {
  return `Visual: ${visual}\n\nAudio: ${audio}`
}
