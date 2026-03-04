import type { OrgBranding } from '@/types'

export type OrgContext = {
  orgName: string
  domain: string | null
  branding: OrgBranding | null
  serviceAreaStates?: string[]
  serviceAreaCounties?: string[]
}

export type PromptPair = {
  system: string
  user: string
}

export function buildBrandVoiceBlock(org: OrgContext): string {
  const tagline = org.branding?.tagline ? `Tagline: "${org.branding.tagline}"` : ''
  return `
Company: ${org.orgName}
${org.domain ? `Website: ${org.domain}` : ''}
${tagline}
Service Area: ${org.serviceAreaStates?.join(', ') ?? 'Not specified'} (Counties: ${org.serviceAreaCounties?.join(', ') ?? 'Not specified'})
`.trim()
}

export const STRUCTURED_CONTENT_FORMAT_INSTRUCTION = `
Return your response as valid JSON matching this exact structure:
{
  "headline": "string - compelling H1 headline",
  "intro": "string - engaging intro paragraph (2-3 sentences)",
  "sections": [
    { "title": "string - H2 section heading", "body": "string - section content (HTML allowed: <p>, <ul>, <li>, <strong>, <em>)" }
  ],
  "cta": "string - call-to-action paragraph",
  "meta_title": "string - SEO meta title (max 60 chars)",
  "meta_description": "string - SEO meta description (max 160 chars)"
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation, no preamble.
`
