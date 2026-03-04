import type { ContentType, StructuredContent } from './content'

// --- SEO Rule System ---

export type SeoRuleId =
  | 'meta-title-length'
  | 'meta-description-length'
  | 'heading-structure'
  | 'content-length'
  | 'intro-present'
  | 'keyword-in-title'
  | 'keyword-in-content'
  | 'keyword-density'
  | 'cta-present'
  | 'paragraph-length'

export type SeoRuleCategory =
  | 'meta-tags'
  | 'content-structure'
  | 'keyword-optimization'
  | 'readability'

export type SeoRuleResult = {
  id: SeoRuleId
  label: string
  category: SeoRuleCategory
  score: number // 0–100
  weight: number
  passed: boolean
  recommendation: string | null
}

export type SeoScoreResult = {
  score: number // 0–100 weighted composite
  rules: SeoRuleResult[]
  categoryScores: Record<SeoRuleCategory, number>
  summary: string
}

export type SeoScorerInput = {
  content: StructuredContent
  keywords: string[]
  contentType: ContentType
}

// --- Dashboard Types ---

export type SeoScoreDistribution = {
  excellent: number // 80–100
  good: number // 60–79
  needsWork: number // 40–59
  poor: number // 0–39
}

export type SeoContentTypeSummary = {
  contentType: ContentType
  count: number
  averageScore: number
}

export type SeoOverview = {
  averageScore: number
  totalPages: number
  scoreDistribution: SeoScoreDistribution
  contentByType: SeoContentTypeSummary[]
  recentScores: SeoContentItem[]
}

export type SeoContentItem = {
  id: string
  contentType: ContentType
  title: string
  slug: string
  status: string
  seoScore: number
  topIssue: string | null
}
