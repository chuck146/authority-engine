import type { LocationPageInput } from '@/types/content'
import {
  buildBrandVoiceBlock,
  STRUCTURED_CONTENT_FORMAT_INSTRUCTION,
  type OrgContext,
  type PromptPair,
} from './shared'

export function buildLocationPagePrompt(input: LocationPageInput, org: OrgContext): PromptPair {
  const keywordsInstruction = input.targetKeywords?.length
    ? `Target keywords to include naturally: ${input.targetKeywords.join(', ')}`
    : `Identify and naturally incorporate 3-5 relevant local SEO keywords for "${input.serviceName}" in ${input.city}, ${input.state}.`

  const countyContext = input.county
    ? `\n- This town is in ${input.county} County, ${input.state}. Mention the county naturally 1-2 times to capture county-level search queries.`
    : ''

  return {
    system: `You are an expert local SEO copywriter specializing in home improvement and painting contractor websites. You write location-specific service pages that rank for "[service] in [city]" searches and convert local visitors into leads.

Tone: ${input.tone}
${buildBrandVoiceBlock(org)}

Guidelines:
- Write specifically for homeowners in ${input.city}, ${input.state}
- Reference local landmarks, neighborhoods, or character where relevant (but do not fabricate specific details you are unsure about)${countyContext}
- Include the city name naturally throughout the content (3-5 times)
- Sections should cover: local service overview, why homeowners in this area need this service, the company's presence in the area, and a local call to action
- Generate 4-5 sections
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body text
- meta_title format: "${input.serviceName} in ${input.city}, ${input.state} | [Company Name]"
- meta_description should mention the city and include a call to action`,
    user: `Generate an SEO-optimized location page for: "${input.serviceName}" in ${input.city}, ${input.state}

${keywordsInstruction}

${STRUCTURED_CONTENT_FORMAT_INSTRUCTION}`,
  }
}
