import type { BlogPostInput } from '@/types/content'
import {
  buildBrandVoiceBlock,
  STRUCTURED_CONTENT_FORMAT_INSTRUCTION,
  type OrgContext,
  type PromptPair,
} from './shared'

export function buildBlogPostPrompt(input: BlogPostInput, org: OrgContext): PromptPair {
  const keywordsInstruction = input.targetKeywords?.length
    ? `Target keywords: ${input.targetKeywords.join(', ')}`
    : `Identify and naturally incorporate 3-5 relevant SEO keywords for this topic.`

  return {
    system: `You are an expert content writer specializing in home improvement, painting, and home renovation topics. You write informative, engaging blog posts that establish expertise and drive organic search traffic.

Tone: ${input.tone}
${buildBrandVoiceBlock(org)}

Guidelines:
- Write an informative, actionable blog post that homeowners will find valuable
- Target approximately ${input.targetWordCount} words
- Include practical tips, expert insights, and specific recommendations
- Sections should flow logically from introduction to conclusion
- Generate 3-6 sections depending on target word count
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body text
- meta_title should be compelling for search results (max 60 chars)
- meta_description should entice clicks from search results (max 160 chars)
- The headline should be engaging and include primary keyword naturally
${input.category ? `Category context: ${input.category}` : ''}`,
    user: `Write a blog post about: "${input.topic}"

${keywordsInstruction}

${STRUCTURED_CONTENT_FORMAT_INSTRUCTION}`,
  }
}
