/**
 * Fix Long Meta Titles — Trim to 60 characters or fewer
 *
 * Queries all content pages, finds meta titles exceeding 60 characters,
 * applies deterministic trimming rules, and recalculates SEO scores.
 *
 * Usage:
 *   npx tsx scripts/fix-long-meta-titles.ts --dry-run
 *   npx tsx scripts/fix-long-meta-titles.ts
 *   npx tsx scripts/fix-long-meta-titles.ts --type=location_page
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const MAX_TITLE_LENGTH = 60

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
const filterType = flagMap.get('type') as 'service_page' | 'location_page' | 'blog_post' | undefined

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// SEO scoring (inline — mirrors lib/seo/rules.ts + scorer.ts)
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
): number {
  type Rule = { score: number; weight: number }
  const rules: Rule[] = []

  // Meta title length (weight: 15)
  const titleLen = content.meta_title.length
  let titleScore = 0
  if (titleLen === 0) titleScore = 0
  else if (titleLen >= 30 && titleLen <= 60) titleScore = 100
  else if (titleLen < 30) titleScore = linearScale(titleLen, 0, 30)
  else titleScore = Math.max(50, 100 - (titleLen - 60) * 2)
  rules.push({ score: titleScore, weight: 15 })

  // Meta description length (weight: 10)
  const descLen = content.meta_description.length
  let descScore = 0
  if (descLen === 0) descScore = 0
  else if (descLen >= 120 && descLen <= 160) descScore = 100
  else if (descLen < 120) descScore = linearScale(descLen, 0, 120)
  else descScore = Math.max(50, 100 - (descLen - 160) * 2)
  rules.push({ score: descScore, weight: 10 })

  // Heading structure (weight: 10)
  const sectionCount = content.sections.length
  const emptyTitles = content.sections.filter((s) => s.title.trim().length === 0).length
  let headingScore = sectionCount >= 3 ? 100 : sectionCount === 2 ? 70 : 40
  if (emptyTitles > 0) headingScore = Math.max(0, headingScore - emptyTitles * 15)
  rules.push({ score: headingScore, weight: 10 })

  // Content length (weight: 15)
  const bodyText = getBodyText(content)
  const wordCount = countWords(bodyText)
  const wordTarget = contentType === 'blog_post' ? 600 : 300
  const lengthScore = wordCount >= wordTarget ? 100 : linearScale(wordCount, 0, wordTarget)
  rules.push({ score: lengthScore, weight: 15 })

  // Intro present (weight: 5)
  const introLen = content.intro.trim().length
  const introScore = introLen >= 50 ? 100 : introLen >= 20 ? 60 : introLen > 0 ? 20 : 0
  rules.push({ score: introScore, weight: 5 })

  // Keyword in title (weight: 10)
  let kwTitleScore = 50
  if (keywords.length > 0) {
    const title = content.meta_title.toLowerCase()
    kwTitleScore = keywords.some((kw) => title.includes(kw.toLowerCase())) ? 100 : 0
  }
  rules.push({ score: kwTitleScore, weight: 10 })

  // Keyword in content (weight: 10)
  let kwContentScore = 50
  if (keywords.length > 0) {
    const body = bodyText.toLowerCase()
    kwContentScore = keywords.some((kw) => body.includes(kw.toLowerCase())) ? 100 : 0
  }
  rules.push({ score: kwContentScore, weight: 10 })

  // Keyword density (weight: 5)
  let densityScore = 50
  if (keywords.length > 0 && wordCount > 0) {
    const primary = keywords[0]!.toLowerCase()
    const kwWords = primary.split(/\s+/).length
    const occurrences = bodyText.toLowerCase().split(primary).length - 1
    const density = ((occurrences * kwWords) / wordCount) * 100
    if (density >= 1 && density <= 3) densityScore = 100
    else if (density < 1) densityScore = 50
    else densityScore = 60
  }
  rules.push({ score: densityScore, weight: 5 })

  // CTA present (weight: 5)
  const ctaLen = content.cta.trim().length
  const ctaScore = ctaLen >= 10 ? 100 : ctaLen > 0 ? 50 : 0
  rules.push({ score: ctaScore, weight: 5 })

  // Paragraph length (weight: 15)
  let paraScore = 0
  if (content.sections.length > 0) {
    const sentCounts = content.sections.map((s) => countSentences(s.body))
    const avg = sentCounts.reduce((a, b) => a + b, 0) / sentCounts.length
    if (avg >= 2 && avg <= 6) paraScore = 100
    else if (avg < 2) paraScore = 60
    else paraScore = 70
  }
  rules.push({ score: paraScore, weight: 15 })

  // Compute weighted score
  const totalWeight = rules.reduce((s, r) => s + r.weight, 0)
  const weightedSum = rules.reduce((s, r) => s + r.score * r.weight, 0)
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

// ---------------------------------------------------------------------------
// Title trimming logic
// ---------------------------------------------------------------------------

function trimTitle(title: string): string {
  if (title.length <= MAX_TITLE_LENGTH) return title

  // Step 1: Shorten common suffixes
  const suffixReplacements: [RegExp, string][] = [
    [/ \| Cleanest Painting LLC$/i, ' | Cleanest Painting'],
    [/ \| Cleanest Painting NJ$/i, ' | Cleanest Painting'],
    [/ — Cleanest Painting LLC$/i, ' | Cleanest Painting'],
    [/ — Cleanest Painting NJ$/i, ' | Cleanest Painting'],
  ]

  let trimmed = title
  for (const [pattern, replacement] of suffixReplacements) {
    if (trimmed.length <= MAX_TITLE_LENGTH) break
    trimmed = trimmed.replace(pattern, replacement)
  }
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed

  // Step 2: Use minimal suffix
  const pipeIndex = trimmed.lastIndexOf(' | ')
  const dashIndex = trimmed.lastIndexOf(' — ')
  const sepIndex = Math.max(pipeIndex, dashIndex)

  if (sepIndex > 0) {
    const descriptive = trimmed.slice(0, sepIndex)
    const withShortSuffix = `${descriptive} | CP NJ`
    if (withShortSuffix.length <= MAX_TITLE_LENGTH) return withShortSuffix
  }

  // Step 3: Truncate descriptive portion, keep short suffix
  if (sepIndex > 0) {
    const suffix = ' | CP NJ'
    const maxDescriptive = MAX_TITLE_LENGTH - suffix.length
    const descriptive = trimmed.slice(0, sepIndex)
    // Truncate at last word boundary
    let truncated = descriptive.slice(0, maxDescriptive)
    const lastSpace = truncated.lastIndexOf(' ')
    if (lastSpace > maxDescriptive * 0.6) {
      truncated = truncated.slice(0, lastSpace)
    }
    return `${truncated}${suffix}`
  }

  // Step 4: No separator — just truncate at word boundary
  let truncated = trimmed.slice(0, MAX_TITLE_LENGTH)
  const lastSpace = truncated.lastIndexOf(' ')
  if (lastSpace > MAX_TITLE_LENGTH * 0.6) {
    truncated = truncated.slice(0, lastSpace)
  }
  return truncated
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
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Fix Long Meta Titles (>60 chars) ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  if (filterType) console.log(`Filter: ${filterType}`)
  if (dryRun) console.log('[DRY RUN — no changes will be made]')

  const tables: { name: string; type: ContentType }[] = [
    { name: 'service_pages', type: 'service_page' },
    { name: 'location_pages', type: 'location_page' },
    { name: 'blog_posts', type: 'blog_post' },
  ]

  const results: {
    title: string
    type: string
    oldTitle: string
    newTitle: string
    oldLen: number
    newLen: number
    oldScore: number
    newScore: number
  }[] = []

  let totalScanned = 0
  let totalLong = 0

  for (const { name: tableName, type: contentType } of tables) {
    if (filterType && filterType !== contentType) continue

    console.log(`\n--- ${contentType} ---`)

    const { data: pages, error } = await supabase
      .from(tableName)
      .select('id, title, slug, status, seo_score, keywords, content, meta_title')
      .eq('organization_id', ORG_ID)
      .in('status', ['published', 'review'] as never)
      .returns<ContentRow[]>()

    if (error) {
      console.error(`  Error fetching ${tableName}: ${error.message}`)
      continue
    }

    for (const page of pages ?? []) {
      if (!page.content) continue
      totalScanned++

      const content = page.content
      const currentTitle = content.meta_title
      if (!currentTitle || currentTitle.length <= MAX_TITLE_LENGTH) continue

      totalLong++
      const newTitle = trimTitle(currentTitle)

      console.log(`\n  ${page.title}`)
      console.log(`    Before (${currentTitle.length} chars): "${currentTitle}"`)
      console.log(`    After  (${newTitle.length} chars): "${newTitle}"`)

      const keywords = page.keywords ?? []
      const oldScore = scoreContent(content, keywords, contentType)

      const updatedContent = { ...content, meta_title: newTitle }
      const newScore = scoreContent(updatedContent, keywords, contentType)

      console.log(
        `    SEO score: ${oldScore} → ${newScore} (${newScore >= oldScore ? '+' : ''}${newScore - oldScore})`,
      )

      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from(tableName)
          .update({
            content: updatedContent as unknown as Record<string, unknown>,
            meta_title: newTitle,
            seo_score: newScore,
          } as never)
          .eq('id', page.id)

        if (updateErr) {
          console.error(`    DB update failed: ${updateErr.message}`)
          continue
        }
        console.log('    Updated.')
      } else {
        console.log('    [dry run — no changes]')
      }

      results.push({
        title: page.title,
        type: contentType,
        oldTitle: currentTitle,
        newTitle,
        oldLen: currentTitle.length,
        newLen: newTitle.length,
        oldScore,
        newScore,
      })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('  Summary')
  console.log('='.repeat(60))
  console.log(`  Total pages scanned: ${totalScanned}`)
  console.log(`  Pages with long titles: ${totalLong}`)
  console.log(`  Pages trimmed: ${results.length}`)

  if (results.length > 0) {
    console.log('\n  Before/After:')
    console.log(
      '    ' +
        'Page'.padEnd(35) +
        'Type'.padEnd(15) +
        'Old Len'.padStart(8) +
        'New Len'.padStart(8) +
        'Score'.padStart(12),
    )
    console.log('    ' + '-'.repeat(78))
    for (const r of results) {
      const scoreChange = r.newScore - r.oldScore
      console.log(
        '    ' +
          r.title.slice(0, 34).padEnd(35) +
          r.type.padEnd(15) +
          r.oldLen.toString().padStart(8) +
          r.newLen.toString().padStart(8) +
          `${r.oldScore}→${r.newScore} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`.padStart(12),
      )
    }
  }

  console.log('\n=== Done ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
