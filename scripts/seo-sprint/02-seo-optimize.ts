/**
 * SEO Growth Sprint — Phase 2: On-Page SEO Optimization
 *
 * Fetches all content, runs SEO scoring rule-by-rule, identifies pages
 * scoring below 85, and uses Claude to optimize meta tags, content length,
 * and keyword density. Updates pages in-place and recalculates scores.
 *
 * Usage:
 *   npx tsx scripts/seo-sprint/02-seo-optimize.ts
 *   npx tsx scripts/seo-sprint/02-seo-optimize.ts --dry-run
 *   npx tsx scripts/seo-sprint/02-seo-optimize.ts --threshold=90
 *   npx tsx scripts/seo-sprint/02-seo-optimize.ts --type=blog_post
 *
 * Requires .env.local with:
 *   ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const ORG_NAME = 'Cleanest Painting LLC'
const DEFAULT_THRESHOLD = 85
const GENERATION_DELAY_MS = 3000

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}
const dryRun = flagMap.has('dry-run')
const threshold = flagMap.has('threshold') ? parseInt(flagMap.get('threshold')!, 10) : DEFAULT_THRESHOLD
const filterType = flagMap.get('type') as 'service_page' | 'location_page' | 'blog_post' | undefined

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseJsonResponse(raw: string): unknown {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n')
    const lastFence = cleaned.lastIndexOf('```')
    if (lastFence > firstNewline) {
      cleaned = cleaned.slice(firstNewline + 1, lastFence).trim()
    }
  }
  return JSON.parse(cleaned)
}

async function callClaude(system: string, user: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    temperature: 0.3, // Low temp for SEO optimization (precision over creativity)
    system,
    messages: [{ role: 'user', content: user }],
  })
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('Claude returned no text')
  return textBlock.text
}

// ---------------------------------------------------------------------------
// SEO Scoring (inline — mirrors lib/seo/rules.ts + scorer.ts)
// ---------------------------------------------------------------------------

type StructuredContent = {
  headline: string
  intro: string
  sections: { title: string; body: string }[]
  cta: string
  meta_title: string
  meta_description: string
}

type ContentType = 'service_page' | 'location_page' | 'blog_post'

type RuleResult = {
  id: string
  label: string
  score: number
  weight: number
  passed: boolean
  recommendation: string | null
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

function countWords(text: string): number {
  const stripped = stripHtml(text)
  if (stripped.length === 0) return 0
  return stripped.split(/\s+/).filter(Boolean).length
}

function countSentences(text: string): number {
  const stripped = stripHtml(text)
  if (stripped.length === 0) return 0
  return stripped.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
}

function getBodyText(content: StructuredContent): string {
  return [content.intro, ...content.sections.map((s) => s.body), content.cta]
    .map(stripHtml)
    .join(' ')
}

function linearScale(value: number, _min: number, max: number): number {
  if (value >= max) return 100
  if (value <= 0) return 0
  return Math.round((value / max) * 100)
}

function scoreContent(
  content: StructuredContent,
  keywords: string[],
  contentType: ContentType,
): { score: number; rules: RuleResult[] } {
  const rules: RuleResult[] = []

  // Meta title length (weight: 15)
  const titleLen = content.meta_title.length
  let titleScore = 0
  let titleRec: string | null = null
  if (titleLen === 0) { titleScore = 0; titleRec = 'Add a meta title (30–60 characters).' }
  else if (titleLen >= 30 && titleLen <= 60) { titleScore = 100 }
  else if (titleLen < 30) { titleScore = linearScale(titleLen, 0, 30); titleRec = `Meta title too short (${titleLen} chars). Aim for 30–60.` }
  else { titleScore = Math.max(50, 100 - (titleLen - 60) * 2); titleRec = `Meta title too long (${titleLen} chars). Keep under 60.` }
  rules.push({ id: 'meta-title-length', label: 'Meta Title Length', score: titleScore, weight: 15, passed: titleScore >= 70, recommendation: titleRec })

  // Meta description length (weight: 10)
  const descLen = content.meta_description.length
  let descScore = 0
  let descRec: string | null = null
  if (descLen === 0) { descScore = 0; descRec = 'Add a meta description (120–160 characters).' }
  else if (descLen >= 120 && descLen <= 160) { descScore = 100 }
  else if (descLen < 120) { descScore = linearScale(descLen, 0, 120); descRec = `Meta description short (${descLen} chars). Aim for 120–160.` }
  else { descScore = Math.max(50, 100 - (descLen - 160) * 2); descRec = `Meta description too long (${descLen} chars). Keep under 160.` }
  rules.push({ id: 'meta-description-length', label: 'Meta Description Length', score: descScore, weight: 10, passed: descScore >= 70, recommendation: descRec })

  // Heading structure (weight: 10)
  const sectionCount = content.sections.length
  const emptyTitles = content.sections.filter((s) => s.title.trim().length === 0).length
  let headingScore = sectionCount >= 3 ? 100 : sectionCount === 2 ? 70 : 40
  if (emptyTitles > 0) headingScore = Math.max(0, headingScore - emptyTitles * 15)
  rules.push({ id: 'heading-structure', label: 'Heading Structure', score: headingScore, weight: 10, passed: headingScore >= 70, recommendation: headingScore < 100 ? `${sectionCount} sections (3+ recommended)` : null })

  // Content length (weight: 15)
  const bodyText = getBodyText(content)
  const wordCount = countWords(bodyText)
  const wordTarget = contentType === 'blog_post' ? 600 : 300
  const lengthScore = wordCount >= wordTarget ? 100 : linearScale(wordCount, 0, wordTarget)
  rules.push({ id: 'content-length', label: 'Content Length', score: lengthScore, weight: 15, passed: lengthScore >= 70, recommendation: lengthScore < 100 ? `${wordCount} words (target: ${wordTarget}+)` : null })

  // Intro present (weight: 5)
  const introLen = content.intro.trim().length
  const introScore = introLen >= 50 ? 100 : introLen >= 20 ? 60 : introLen > 0 ? 20 : 0
  rules.push({ id: 'intro-present', label: 'Introduction', score: introScore, weight: 5, passed: introScore >= 70, recommendation: introScore < 100 ? 'Expand intro to 50+ characters.' : null })

  // Keyword in title (weight: 10)
  let kwTitleScore = 50
  let kwTitleRec: string | null = 'Add target keywords.'
  if (keywords.length > 0) {
    const title = content.meta_title.toLowerCase()
    kwTitleScore = keywords.some((kw) => title.includes(kw.toLowerCase())) ? 100 : 0
    kwTitleRec = kwTitleScore === 100 ? null : 'Include a keyword in meta title.'
  }
  rules.push({ id: 'keyword-in-title', label: 'Keyword in Title', score: kwTitleScore, weight: 10, passed: kwTitleScore >= 70, recommendation: kwTitleRec })

  // Keyword in content (weight: 10)
  let kwContentScore = 50
  let kwContentRec: string | null = 'Add target keywords.'
  if (keywords.length > 0) {
    const body = bodyText.toLowerCase()
    kwContentScore = keywords.some((kw) => body.includes(kw.toLowerCase())) ? 100 : 0
    kwContentRec = kwContentScore === 100 ? null : 'Include keywords in page content.'
  }
  rules.push({ id: 'keyword-in-content', label: 'Keyword in Content', score: kwContentScore, weight: 10, passed: kwContentScore >= 70, recommendation: kwContentRec })

  // Keyword density (weight: 5)
  let densityScore = 50
  let densityRec: string | null = 'Add keywords to measure density.'
  if (keywords.length > 0 && wordCount > 0) {
    const primary = keywords[0]!.toLowerCase()
    const kwWords = primary.split(/\s+/).length
    const occurrences = bodyText.toLowerCase().split(primary).length - 1
    const density = ((occurrences * kwWords) / wordCount) * 100
    if (density >= 1 && density <= 3) { densityScore = 100; densityRec = null }
    else if (density < 1) { densityScore = 50; densityRec = `Keyword density low (${density.toFixed(1)}%). Aim for 1–3%.` }
    else { densityScore = 60; densityRec = `Keyword density high (${density.toFixed(1)}%). Keep 1–3%.` }
  }
  rules.push({ id: 'keyword-density', label: 'Keyword Density', score: densityScore, weight: 5, passed: densityScore >= 70, recommendation: densityRec })

  // CTA present (weight: 5)
  const ctaLen = content.cta.trim().length
  const ctaScore = ctaLen >= 10 ? 100 : ctaLen > 0 ? 50 : 0
  rules.push({ id: 'cta-present', label: 'Call to Action', score: ctaScore, weight: 5, passed: ctaScore >= 70, recommendation: ctaScore < 100 ? 'Add a CTA (10+ characters).' : null })

  // Paragraph length (weight: 15)
  let paraScore = 0
  let paraRec: string | null = 'Add content sections.'
  if (content.sections.length > 0) {
    const sentCounts = content.sections.map((s) => countSentences(s.body))
    const avg = sentCounts.reduce((a, b) => a + b, 0) / sentCounts.length
    if (avg >= 2 && avg <= 6) { paraScore = 100; paraRec = null }
    else if (avg < 2) { paraScore = 60; paraRec = 'Sections too short. Aim for 2–6 sentences each.' }
    else { paraScore = 70; paraRec = `Sections avg ${Math.round(avg)} sentences. Consider shorter paragraphs (2–6).` }
  }
  rules.push({ id: 'paragraph-length', label: 'Paragraph Length', score: paraScore, weight: 15, passed: paraScore >= 70, recommendation: paraRec })

  // Compute weighted score
  const totalWeight = rules.reduce((s, r) => s + r.weight, 0)
  const weightedSum = rules.reduce((s, r) => s + r.score * r.weight, 0)
  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0

  return { score, rules }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentRow = {
  id: string
  title: string
  slug: string
  status: string
  seo_score: number | null
  keywords: string[] | null
  content: StructuredContent | null
  meta_title: string | null
  meta_description: string | null
}

// ---------------------------------------------------------------------------
// Optimization via Claude
// ---------------------------------------------------------------------------

function buildOptimizationPrompt(
  page: ContentRow,
  contentType: ContentType,
  failedRules: RuleResult[],
): { system: string; user: string } {
  const issueList = failedRules
    .map((r) => `- ${r.label} (score: ${r.score}/100): ${r.recommendation}`)
    .join('\n')

  return {
    system: `You are an SEO optimization specialist. Your job is to improve existing page content to fix specific SEO issues WITHOUT changing the overall meaning, tone, or brand voice.

Brand: ${ORG_NAME}
Guidelines:
- Preserve the original content's meaning and structure
- Only modify what's needed to fix the identified issues
- meta_title: 30–60 chars, include primary keyword at the start
- meta_description: 120–160 chars, include CTA
- Keep keyword density between 1–3% for the primary keyword
- Sections should have 2–6 sentences each
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) in section bodies
- Do not fabricate facts or statistics`,
    user: `Optimize this ${contentType.replace('_', ' ')} to fix the following SEO issues:

${issueList}

Current page title: "${page.title}"
Current keywords: ${(page.keywords ?? []).join(', ')}
Current meta_title: "${page.content?.meta_title ?? ''}"
Current meta_description: "${page.content?.meta_description ?? ''}"

Current content (JSON):
${JSON.stringify(page.content, null, 2)}

Return the FULL optimized content as a valid JSON object (no markdown, no code fences) in this exact format:
{
  "headline": "string",
  "intro": "string",
  "sections": [{ "title": "string", "body": "string" }],
  "cta": "string",
  "meta_title": "string — max 60 chars",
  "meta_description": "string — max 160 chars"
}

Only change what's necessary to fix the identified issues. Keep everything else identical.`,
  }
}

async function optimizePage(
  table: string,
  page: ContentRow,
  contentType: ContentType,
): Promise<{ before: number; after: number } | null> {
  const content = page.content
  if (!content) {
    console.log(`    Skipping ${page.title} — no content`)
    return null
  }

  const keywords = page.keywords ?? []
  const { score: beforeScore, rules } = scoreContent(content, keywords, contentType)

  if (beforeScore >= threshold) {
    return null // Already above threshold
  }

  const failedRules = rules.filter((r) => !r.passed)
  if (failedRules.length === 0) {
    return null
  }

  console.log(`\n  Optimizing: ${page.title}`)
  console.log(`    Before: ${beforeScore}/100`)
  console.log(`    Issues: ${failedRules.map((r) => r.label).join(', ')}`)

  if (dryRun) {
    console.log('    [dry run — no changes]')
    return { before: beforeScore, after: beforeScore }
  }

  try {
    const prompt = buildOptimizationPrompt(page, contentType, failedRules)
    const raw = await callClaude(prompt.system, prompt.user)
    const optimized = parseJsonResponse(raw) as StructuredContent

    // Recalculate score
    const { score: afterScore } = scoreContent(optimized, keywords, contentType)

    // Update in database
    const { error: updateErr } = await supabase
      .from(table)
      .update({
        content: optimized as unknown as Record<string, unknown>,
        meta_title: optimized.meta_title,
        meta_description: optimized.meta_description,
        seo_score: afterScore,
      } as never)
      .eq('id', page.id)

    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`)

    console.log(`    After: ${afterScore}/100 (${afterScore > beforeScore ? '+' : ''}${afterScore - beforeScore})`)
    return { before: beforeScore, after: afterScore }
  } catch (err) {
    console.error(`    Error: ${(err as Error).message}`)
    return null
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== SEO Growth Sprint — Phase 2: On-Page SEO Optimization ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  console.log(`Threshold: ${threshold}`)
  if (filterType) console.log(`Filter: ${filterType}`)
  if (dryRun) console.log('[DRY RUN — no changes will be made]')

  const tables: { name: string; type: ContentType }[] = [
    { name: 'service_pages', type: 'service_page' },
    { name: 'location_pages', type: 'location_page' },
    { name: 'blog_posts', type: 'blog_post' },
  ]

  const results: { title: string; type: string; before: number; after: number }[] = []
  let totalScored = 0
  let totalBelowThreshold = 0

  for (const { name: tableName, type: contentType } of tables) {
    if (filterType && filterType !== contentType) continue

    console.log(`\n--- ${contentType} ---`)

    const { data: pages, error } = await supabase
      .from(tableName)
      .select('id, title, slug, status, seo_score, keywords, content, meta_title, meta_description')
      .eq('organization_id', ORG_ID)
      .in('status', ['published', 'review'] as never)
      .returns<ContentRow[]>()

    if (error) {
      console.error(`  Error fetching ${tableName}: ${error.message}`)
      continue
    }

    for (const page of pages ?? []) {
      if (!page.content) continue
      totalScored++

      const keywords = page.keywords ?? []
      const { score } = scoreContent(page.content as StructuredContent, keywords, contentType)

      // Update stored score if it doesn't match calculated
      if (page.seo_score !== score && !dryRun) {
        await supabase
          .from(tableName)
          .update({ seo_score: score } as never)
          .eq('id', page.id)
      }

      if (score < threshold) {
        totalBelowThreshold++
        const result = await optimizePage(tableName, page, contentType)
        if (result) {
          results.push({ title: page.title, type: contentType, ...result })
        }

        if (!dryRun) await sleep(GENERATION_DELAY_MS)
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('  Phase 2 Summary')
  console.log('='.repeat(60))
  console.log(`  Total pages scored: ${totalScored}`)
  console.log(`  Pages below ${threshold}: ${totalBelowThreshold}`)
  console.log(`  Pages optimized: ${results.length}`)

  if (results.length > 0) {
    console.log('\n  Before/After comparison:')
    console.log('    ' + 'Page'.padEnd(40) + 'Type'.padEnd(15) + 'Before'.padStart(8) + 'After'.padStart(8) + 'Change'.padStart(8))
    console.log('    ' + '-'.repeat(79))
    for (const r of results) {
      const change = r.after - r.before
      console.log(
        '    ' +
        r.title.slice(0, 39).padEnd(40) +
        r.type.padEnd(15) +
        r.before.toString().padStart(8) +
        r.after.toString().padStart(8) +
        `${change >= 0 ? '+' : ''}${change}`.padStart(8),
      )
    }

    const avgImprovement = Math.round(results.reduce((s, r) => s + (r.after - r.before), 0) / results.length)
    console.log(`\n  Average improvement: ${avgImprovement >= 0 ? '+' : ''}${avgImprovement} points`)
  }

  console.log('\n=== Phase 2 Complete ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
