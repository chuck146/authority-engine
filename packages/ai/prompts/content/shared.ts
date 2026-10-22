import type { OrgBranding } from '@/types'

export type OrgContext = {
  orgName: string
  domain: string | null
  branding: OrgBranding | null
  serviceAreaStates?: string[]
  serviceAreaCounties?: string[]
  // Owner-confirmed claims (organizations.settings.verified_facts), e.g.
  // "Licensed and insured", "NJ HIC registered". The only company-specific
  // claims generated content may make.
  verifiedFacts?: string[]
}

export type PromptPair = {
  system: string
  user: string
}

export function buildFactsGuardrail(org: OrgContext): string {
  const facts = org.verifiedFacts?.filter((f) => f.trim().length > 0) ?? []
  const factList = facts.length > 0 ? facts.map((f) => `- ${f}`).join('\n') : '- (none provided)'
  return `
Verified company facts — the ONLY company-specific claims you may make:
${factList}

Accuracy rules:
- Never invent company facts: years in business, license or registration numbers, insurance, bonding, certifications, awards, ratings, review counts, project counts, prices, warranties, guarantees, turnaround times, named customers, testimonials, or local projects.
- If a point would need a fact that is not listed above, leave it out or tell the homeowner what to ask about instead.
- General painting knowledge (preparation steps, product types, what affects cost or timing) is fine when written as general information, not as a company promise.
- No "best", "#1", or "top-rated" claims.
`.trim()
}

export function buildBrandVoiceBlock(org: OrgContext): string {
  const tagline = org.branding?.tagline ? `Tagline: "${org.branding.tagline}"` : ''
  return `
Company: ${org.orgName}
${org.domain ? `Website: ${org.domain}` : ''}
${tagline}
Service Area: ${org.serviceAreaStates?.join(', ') ?? 'Not specified'} (Counties: ${org.serviceAreaCounties?.join(', ') ?? 'Not specified'})

${buildFactsGuardrail(org)}
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
