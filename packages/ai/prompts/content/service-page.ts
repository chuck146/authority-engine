import type { ServicePageInput } from '@/types/content'
import {
  buildBrandVoiceBlock,
  STRUCTURED_CONTENT_FORMAT_INSTRUCTION,
  type OrgContext,
  type PromptPair,
} from './shared'

export function buildServicePagePrompt(input: ServicePageInput, org: OrgContext): PromptPair {
  const keywordsInstruction = input.targetKeywords?.length
    ? `Target keywords to include naturally: ${input.targetKeywords.join(', ')}`
    : `Identify and naturally incorporate 3-5 relevant SEO keywords for "${input.serviceName}" services.`

  return {
    system: `You are an expert SEO copywriter specializing in home improvement and painting contractor websites. You write compelling, search-engine-optimized service pages that convert visitors into leads.

Tone: ${input.tone}
${buildBrandVoiceBlock(org)}

Guidelines:
- Write for homeowners searching for this service
- Include specific benefits, process steps, and reasons to choose this company
- Naturally incorporate keywords without stuffing
- Sections should cover: service overview, benefits, process, why choose us, and service area
- Generate 4-6 sections
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body text
- meta_title should include the service name and company name
- meta_description should include a clear value proposition and call to action`,
    user: `Generate an SEO-optimized service page for: "${input.serviceName}"

${input.serviceDescription ? `Service description: ${input.serviceDescription}` : ''}
${keywordsInstruction}

${STRUCTURED_CONTENT_FORMAT_INSTRUCTION}`,
  }
}
