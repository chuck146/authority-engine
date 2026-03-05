import type { SeoRuleId, SeoRuleCategory, SeoRuleResult, SeoScorerInput } from '@/types/seo'

type RuleDefinition = {
  id: SeoRuleId
  label: string
  category: SeoRuleCategory
  weight: number
  evaluate: (input: SeoScorerInput) => { score: number; recommendation: string | null }
}

/** Strip HTML tags from a string */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

/** Count words in plain text */
function countWords(text: string): number {
  const stripped = stripHtml(text)
  if (stripped.length === 0) return 0
  return stripped.split(/\s+/).filter(Boolean).length
}

/** Count sentences (rough heuristic: split on . ! ?) */
function countSentences(text: string): number {
  const stripped = stripHtml(text)
  if (stripped.length === 0) return 0
  return stripped.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
}

/** Get all body text from content */
function getBodyText(input: SeoScorerInput): string {
  const { content } = input
  return [content.intro, ...content.sections.map((s) => s.body), content.cta]
    .map(stripHtml)
    .join(' ')
}

/** Linear scale: returns 0–100 for value in [min, max] */
function linearScale(value: number, min: number, max: number): number {
  if (value >= max) return 100
  if (value <= 0) return 0
  return Math.round((value / max) * 100)
}

export const rules: RuleDefinition[] = [
  // --- Meta Tags ---
  {
    id: 'meta-title-length',
    label: 'Meta Title Length',
    category: 'meta-tags',
    weight: 15,
    evaluate: ({ content }) => {
      const len = content.meta_title.length
      if (len === 0)
        return { score: 0, recommendation: 'Add a meta title (30–60 characters recommended).' }
      if (len >= 30 && len <= 60) return { score: 100, recommendation: null }
      if (len < 30)
        return {
          score: linearScale(len, 0, 30),
          recommendation: `Meta title is too short (${len} chars). Aim for 30–60 characters.`,
        }
      return {
        score: Math.max(50, 100 - (len - 60) * 2),
        recommendation: `Meta title is too long (${len} chars). Keep it under 60 characters.`,
      }
    },
  },
  {
    id: 'meta-description-length',
    label: 'Meta Description Length',
    category: 'meta-tags',
    weight: 10,
    evaluate: ({ content }) => {
      const len = content.meta_description.length
      if (len === 0)
        return {
          score: 0,
          recommendation: 'Add a meta description (120–160 characters recommended).',
        }
      if (len >= 120 && len <= 160) return { score: 100, recommendation: null }
      if (len < 120)
        return {
          score: linearScale(len, 0, 120),
          recommendation: `Meta description is short (${len} chars). Aim for 120–160 characters.`,
        }
      return {
        score: Math.max(50, 100 - (len - 160) * 2),
        recommendation: `Meta description is too long (${len} chars). Keep it under 160 characters.`,
      }
    },
  },

  // --- Content Structure ---
  {
    id: 'heading-structure',
    label: 'Heading Structure',
    category: 'content-structure',
    weight: 10,
    evaluate: ({ content }) => {
      const sections = content.sections
      const count = sections.length
      const emptyTitles = sections.filter((s) => s.title.trim().length === 0).length

      let score: number
      if (count >= 3) score = 100
      else if (count === 2) score = 70
      else score = 40

      if (emptyTitles > 0) score = Math.max(0, score - emptyTitles * 15)

      const recommendation =
        score === 100
          ? null
          : count < 3
            ? `Add more content sections (${count} found, 3+ recommended).`
            : `${emptyTitles} section(s) have empty headings.`

      return { score, recommendation }
    },
  },
  {
    id: 'content-length',
    label: 'Content Length',
    category: 'content-structure',
    weight: 15,
    evaluate: (input) => {
      const words = countWords(getBodyText(input))
      const target = input.contentType === 'blog_post' ? 600 : 300

      if (words >= target) return { score: 100, recommendation: null }
      const score = linearScale(words, 0, target)
      return {
        score,
        recommendation: `Content is ${words} words. Aim for ${target}+ words for better SEO.`,
      }
    },
  },
  {
    id: 'intro-present',
    label: 'Introduction Present',
    category: 'content-structure',
    weight: 5,
    evaluate: ({ content }) => {
      const len = content.intro.trim().length
      if (len >= 50) return { score: 100, recommendation: null }
      if (len >= 20)
        return { score: 60, recommendation: 'Expand the introduction to at least 50 characters.' }
      if (len > 0)
        return {
          score: 20,
          recommendation: 'Introduction is very short. Expand it to improve engagement.',
        }
      return { score: 0, recommendation: 'Add an introduction paragraph.' }
    },
  },

  // --- Keyword Optimization ---
  {
    id: 'keyword-in-title',
    label: 'Keyword in Title',
    category: 'keyword-optimization',
    weight: 10,
    evaluate: ({ content, keywords }) => {
      if (keywords.length === 0)
        return { score: 50, recommendation: 'Add target keywords to improve optimization.' }
      const title = content.meta_title.toLowerCase()
      const found = keywords.some((kw) => title.includes(kw.toLowerCase()))
      if (found) return { score: 100, recommendation: null }
      return { score: 0, recommendation: `Include a target keyword in the meta title.` }
    },
  },
  {
    id: 'keyword-in-content',
    label: 'Keyword in Content',
    category: 'keyword-optimization',
    weight: 10,
    evaluate: (input) => {
      const { keywords } = input
      if (keywords.length === 0)
        return { score: 50, recommendation: 'Add target keywords to improve optimization.' }
      const body = getBodyText(input).toLowerCase()
      const found = keywords.some((kw) => body.includes(kw.toLowerCase()))
      if (found) return { score: 100, recommendation: null }
      return { score: 0, recommendation: 'Include target keywords in the page content.' }
    },
  },
  {
    id: 'keyword-density',
    label: 'Keyword Density',
    category: 'keyword-optimization',
    weight: 5,
    evaluate: (input) => {
      const { keywords } = input
      if (keywords.length === 0)
        return { score: 50, recommendation: 'Add target keywords to measure density.' }

      const body = getBodyText(input).toLowerCase()
      const totalWords = countWords(body)
      if (totalWords === 0)
        return { score: 0, recommendation: 'Add content to measure keyword density.' }

      // Count occurrences of the primary keyword (first in array)
      const primary = keywords[0]!.toLowerCase()
      const keywordWords = primary.split(/\s+/).length
      const occurrences = body.split(primary).length - 1
      const density = ((occurrences * keywordWords) / totalWords) * 100

      if (density >= 1 && density <= 3) return { score: 100, recommendation: null }
      if (density < 1)
        return {
          score: 50,
          recommendation: `Keyword density is low (${density.toFixed(1)}%). Aim for 1–3%.`,
        }
      return {
        score: 60,
        recommendation: `Keyword density is high (${density.toFixed(1)}%). Keep it between 1–3% to avoid keyword stuffing.`,
      }
    },
  },

  // --- Readability ---
  {
    id: 'cta-present',
    label: 'Call to Action',
    category: 'readability',
    weight: 5,
    evaluate: ({ content }) => {
      const len = content.cta.trim().length
      if (len >= 10) return { score: 100, recommendation: null }
      if (len > 0)
        return {
          score: 50,
          recommendation: 'Expand the call to action (10+ characters recommended).',
        }
      return { score: 0, recommendation: 'Add a call to action to improve conversions.' }
    },
  },
  {
    id: 'paragraph-length',
    label: 'Paragraph Length',
    category: 'readability',
    weight: 15,
    evaluate: ({ content }) => {
      const sections = content.sections
      if (sections.length === 0) return { score: 0, recommendation: 'Add content sections.' }

      const sentenceCounts = sections.map((s) => countSentences(s.body))
      const avg = sentenceCounts.reduce((a, b) => a + b, 0) / sentenceCounts.length

      if (avg >= 2 && avg <= 6) return { score: 100, recommendation: null }
      if (avg < 2)
        return {
          score: 60,
          recommendation: 'Sections are very short. Aim for 2–6 sentences per section.',
        }
      return {
        score: 70,
        recommendation: `Sections average ${Math.round(avg)} sentences. Consider breaking into smaller paragraphs (2–6 sentences ideal).`,
      }
    },
  },
]

export function evaluateRule(rule: RuleDefinition, input: SeoScorerInput): SeoRuleResult {
  const { score, recommendation } = rule.evaluate(input)
  return {
    id: rule.id,
    label: rule.label,
    category: rule.category,
    score: Math.max(0, Math.min(100, Math.round(score))),
    weight: rule.weight,
    passed: score >= 70,
    recommendation,
  }
}
