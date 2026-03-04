import type { SeoRuleCategory, SeoScoreResult, SeoScorerInput } from '@/types/seo'
import { rules, evaluateRule } from './rules'

const CATEGORIES: SeoRuleCategory[] = ['meta-tags', 'content-structure', 'keyword-optimization', 'readability']

/**
 * Calculate full SEO score with rule-by-rule breakdown.
 */
export function calculateSeoScore(input: SeoScorerInput): SeoScoreResult {
  const ruleResults = rules.map((rule) => evaluateRule(rule, input))

  // Weighted composite score
  const totalWeight = ruleResults.reduce((sum, r) => sum + r.weight, 0)
  const weightedSum = ruleResults.reduce((sum, r) => sum + r.score * r.weight, 0)
  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  // Per-category scores
  const categoryScores = {} as Record<SeoRuleCategory, number>
  for (const cat of CATEGORIES) {
    const catRules = ruleResults.filter((r) => r.category === cat)
    const catWeight = catRules.reduce((sum, r) => sum + r.weight, 0)
    const catSum = catRules.reduce((sum, r) => sum + r.score * r.weight, 0)
    categoryScores[cat] = catWeight > 0 ? Math.round(catSum / catWeight) : 0
  }

  // Summary
  const failedCount = ruleResults.filter((r) => !r.passed).length
  let summary: string
  if (score >= 80) {
    summary = failedCount > 0
      ? `Great SEO score. ${failedCount} area(s) could still be improved.`
      : 'Excellent SEO — all checks passed.'
  } else if (score >= 60) {
    summary = `Good foundation. ${failedCount} area(s) need attention to improve rankings.`
  } else if (score >= 40) {
    summary = `SEO needs work. ${failedCount} area(s) need improvement for better visibility.`
  } else {
    summary = `SEO score is low. Address ${failedCount} issue(s) to improve search visibility.`
  }

  return { score, rules: ruleResults, categoryScores, summary }
}

/**
 * Calculate just the 0–100 score number (for DB storage).
 */
export function calculateSeoScoreValue(input: SeoScorerInput): number {
  return calculateSeoScore(input).score
}
