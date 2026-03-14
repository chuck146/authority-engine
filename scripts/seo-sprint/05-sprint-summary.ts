/**
 * SEO Growth Sprint — Phase 5: Sprint Summary & Report
 *
 * Compiles results from all sprint phases into a comprehensive summary.
 * Counts new content, SEO score changes, social posts scheduled,
 * and generates a final actionable report.
 *
 * Usage:
 *   npx tsx scripts/seo-sprint/05-sprint-summary.ts
 *   npx tsx scripts/seo-sprint/05-sprint-summary.ts --since=2026-03-14
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
const ORG_NAME = 'Cleanest Painting LLC'
// Domain used by other sprint phases; kept here for reference
// const DOMAIN = 'cleanestpaintingnj.com'

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}

// Default: look back 7 days for sprint activity
const sinceDate =
  flagMap.get('since') ??
  (() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  })()

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentRow = {
  id: string
  title: string
  slug: string
  status: string
  seo_score: number | null
  created_at: string
  updated_at: string
}

type SocialRow = {
  id: string
  platform: string
  title: string
  status: string
  created_at: string
}

type CalendarRow = {
  id: string
  content_type: string
  title: string
  scheduled_at: string
  status: string
  created_at: string
}

type KeywordRow = {
  query: string
  position: number
  clicks: number
  impressions: number
  ctr: number
  date: string
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchAllContent() {
  const [services, locations, blogs] = await Promise.all([
    supabase
      .from('service_pages')
      .select('id, title, slug, status, seo_score, created_at, updated_at')
      .eq('organization_id', ORG_ID)
      .order('updated_at', { ascending: false })
      .returns<ContentRow[]>(),
    supabase
      .from('location_pages')
      .select('id, title, slug, status, seo_score, created_at, updated_at')
      .eq('organization_id', ORG_ID)
      .order('updated_at', { ascending: false })
      .returns<ContentRow[]>(),
    supabase
      .from('blog_posts')
      .select('id, title, slug, status, seo_score, created_at, updated_at')
      .eq('organization_id', ORG_ID)
      .order('updated_at', { ascending: false })
      .returns<ContentRow[]>(),
  ])

  if (services.error) throw new Error(`Service pages: ${services.error.message}`)
  if (locations.error) throw new Error(`Location pages: ${locations.error.message}`)
  if (blogs.error) throw new Error(`Blog posts: ${blogs.error.message}`)

  return {
    servicePages: (services.data ?? []).map((p) => ({ ...p, type: 'service_page' })),
    locationPages: (locations.data ?? []).map((p) => ({ ...p, type: 'location_page' })),
    blogPosts: (blogs.data ?? []).map((p) => ({ ...p, type: 'blog_post' })),
  }
}

async function fetchSocialPosts() {
  const { data, error } = await supabase
    .from('social_posts')
    .select('id, platform, title, status, created_at')
    .eq('organization_id', ORG_ID)
    .order('created_at', { ascending: false })
    .returns<SocialRow[]>()

  if (error) throw new Error(`Social posts: ${error.message}`)
  return data ?? []
}

async function fetchCalendarEntries() {
  const { data, error } = await supabase
    .from('content_calendar')
    .select('id, content_type, title, scheduled_at, status, created_at')
    .eq('organization_id', ORG_ID)
    .gte('created_at', sinceDate)
    .order('scheduled_at', { ascending: true })
    .returns<CalendarRow[]>()

  if (error) throw new Error(`Calendar: ${error.message}`)
  return data ?? []
}

async function fetchKeywordSummary() {
  const currentEnd = daysAgo(0)
  const currentStart = daysAgo(28)
  const previousStart = daysAgo(56)
  const previousEnd = daysAgo(29)

  const [current, previous] = await Promise.all([
    supabase
      .from('keyword_rankings')
      .select('query, position, clicks, impressions, ctr, date')
      .eq('organization_id', ORG_ID)
      .gte('date', currentStart)
      .lte('date', currentEnd)
      .returns<KeywordRow[]>(),
    supabase
      .from('keyword_rankings')
      .select('query, position, clicks, impressions, ctr, date')
      .eq('organization_id', ORG_ID)
      .gte('date', previousStart)
      .lte('date', previousEnd)
      .returns<KeywordRow[]>(),
  ])

  if (current.error) throw new Error(`Keywords current: ${current.error.message}`)
  if (previous.error) throw new Error(`Keywords previous: ${previous.error.message}`)

  return { current: current.data ?? [], previous: previous.data ?? [] }
}

// ---------------------------------------------------------------------------
// Analysis
// ---------------------------------------------------------------------------

function aggregateKeywordPeriod(rows: KeywordRow[]) {
  let totalClicks = 0
  let totalImpressions = 0
  const posMap = new Map<string, { posSum: number; count: number }>()

  for (const row of rows) {
    totalClicks += row.clicks
    totalImpressions += row.impressions
    const existing = posMap.get(row.query)
    if (existing) {
      existing.posSum += row.position
      existing.count += 1
    } else {
      posMap.set(row.query, { posSum: row.position, count: 1 })
    }
  }

  const uniqueQueries = posMap.size
  let avgPosition = 0
  if (uniqueQueries > 0) {
    let totalAvgPos = 0
    for (const [, v] of posMap) {
      totalAvgPos += v.posSum / v.count
    }
    avgPosition = Math.round((totalAvgPos / uniqueQueries) * 10) / 10
  }

  return { totalClicks, totalImpressions, uniqueQueries, avgPosition }
}

// ---------------------------------------------------------------------------
// Report printer
// ---------------------------------------------------------------------------

function printDivider(title: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(70))
}

function printChange(
  label: string,
  current: number,
  previous: number,
  unit = '',
  lowerIsBetter = false,
) {
  const diff = current - previous
  const pct = previous > 0 ? Math.round((diff / previous) * 100) : 0
  const arrow =
    diff > 0 ? (lowerIsBetter ? 'v' : '^') : diff < 0 ? (lowerIsBetter ? '^' : 'v') : '='
  const sign = diff > 0 ? '+' : ''
  console.log(
    `    ${label.padEnd(30)} ${current}${unit}  (${sign}${diff}${unit}, ${sign}${pct}%) ${arrow}`,
  )
}

async function main() {
  console.log('=== SEO Growth Sprint — Phase 5: Sprint Summary ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  console.log(`Org: ${ORG_NAME}`)
  console.log(`Sprint activity since: ${sinceDate}`)

  // Fetch all data
  const [content, socialPosts, calendarEntries, keywords] = await Promise.all([
    fetchAllContent(),
    fetchSocialPosts(),
    fetchCalendarEntries(),
    fetchKeywordSummary(),
  ])

  const allContent = [...content.servicePages, ...content.locationPages, ...content.blogPosts]

  // -----------------------------------------------------------------------
  // Content overview
  // -----------------------------------------------------------------------

  printDivider('CONTENT INVENTORY')

  const published = allContent.filter((p) => p.status === 'published')
  const inReview = allContent.filter((p) => p.status === 'review')
  const draft = allContent.filter((p) => p.status === 'draft')

  console.log(`\n  Total content pages:  ${allContent.length}`)
  console.log(`    Published:          ${published.length}`)
  console.log(`    In review:          ${inReview.length}`)
  console.log(`    Draft:              ${draft.length}`)

  // New content created during sprint
  const newContent = allContent.filter((p) => p.created_at >= sinceDate)
  const updatedContent = allContent.filter(
    (p) => p.updated_at >= sinceDate && p.created_at < sinceDate,
  )

  console.log(`\n  New content (since ${sinceDate}): ${newContent.length}`)
  if (newContent.length > 0) {
    for (const page of newContent) {
      console.log(
        `    + ${page.title} (${page.type}, status: ${page.status}, SEO: ${page.seo_score ?? 'N/A'})`,
      )
    }
  }

  console.log(`\n  Updated content (since ${sinceDate}): ${updatedContent.length}`)
  if (updatedContent.length > 0) {
    for (const page of updatedContent.slice(0, 10)) {
      console.log(`    ~ ${page.title} (${page.type}, SEO: ${page.seo_score ?? 'N/A'})`)
    }
    if (updatedContent.length > 10) {
      console.log(`    ... and ${updatedContent.length - 10} more`)
    }
  }

  // -----------------------------------------------------------------------
  // SEO scores
  // -----------------------------------------------------------------------

  printDivider('SEO SCORE SUMMARY')

  const scored = allContent.filter((p) => p.seo_score != null)
  const avgScore =
    scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b.seo_score!, 0) / scored.length) : 0

  const below70 = scored.filter((p) => p.seo_score! < 70)
  const between70and85 = scored.filter((p) => p.seo_score! >= 70 && p.seo_score! < 85)
  const above85 = scored.filter((p) => p.seo_score! >= 85)

  console.log(`\n  Pages with SEO scores: ${scored.length}`)
  console.log(`  Average SEO score:     ${avgScore}`)
  console.log(`    Score 85+:           ${above85.length} pages`)
  console.log(`    Score 70-84:         ${between70and85.length} pages`)
  console.log(`    Score <70:           ${below70.length} pages`)

  // By type
  const types = [
    { label: 'Service Pages', items: content.servicePages },
    { label: 'Location Pages', items: content.locationPages },
    { label: 'Blog Posts', items: content.blogPosts },
  ]

  console.log('\n  By content type:')
  for (const { label, items } of types) {
    const s = items.filter((i) => i.seo_score != null)
    const avg = s.length > 0 ? Math.round(s.reduce((a, b) => a + b.seo_score!, 0) / s.length) : 0
    const min = s.length > 0 ? Math.min(...s.map((i) => i.seo_score!)) : 0
    const max = s.length > 0 ? Math.max(...s.map((i) => i.seo_score!)) : 0
    console.log(
      `    ${label.padEnd(18)} avg: ${avg}, min: ${min}, max: ${max} (${items.length} total)`,
    )
  }

  // Lowest scoring pages
  if (below70.length > 0) {
    console.log('\n  Pages needing attention (score < 70):')
    for (const page of below70.sort((a, b) => a.seo_score! - b.seo_score!)) {
      console.log(`    - ${page.title} (${page.type}, SEO: ${page.seo_score})`)
    }
  }

  // -----------------------------------------------------------------------
  // Social posts
  // -----------------------------------------------------------------------

  printDivider('SOCIAL POST DISTRIBUTION')

  const recentSocial = socialPosts.filter((p) => p.created_at >= sinceDate)

  console.log(`\n  Total social posts:    ${socialPosts.length}`)
  console.log(`  Created this sprint:   ${recentSocial.length}`)

  // By platform
  const byPlatform = new Map<string, { total: number; review: number; published: number }>()
  for (const post of socialPosts) {
    const entry = byPlatform.get(post.platform) ?? { total: 0, review: 0, published: 0 }
    entry.total += 1
    if (post.status === 'review') entry.review += 1
    if (post.status === 'published') entry.published += 1
    byPlatform.set(post.platform, entry)
  }

  console.log('\n  By platform:')
  for (const [platform, counts] of [...byPlatform.entries()].sort()) {
    console.log(
      `    ${platform.toUpperCase().padEnd(12)} ${counts.total} total, ${counts.review} in review, ${counts.published} published`,
    )
  }

  // Calendar entries
  console.log(`\n  Calendar entries scheduled this sprint: ${calendarEntries.length}`)
  if (calendarEntries.length > 0) {
    const byType = new Map<string, number>()
    for (const entry of calendarEntries) {
      byType.set(entry.content_type, (byType.get(entry.content_type) ?? 0) + 1)
    }
    for (const [type, count] of byType) {
      console.log(`    ${type.padEnd(18)} ${count}`)
    }

    // Date range
    const dates = calendarEntries.map((e) => e.scheduled_at.slice(0, 10))
    const earliest = dates.sort()[0]
    const latest = dates.sort().reverse()[0]
    console.log(`\n  Schedule window: ${earliest} to ${latest}`)
  }

  // -----------------------------------------------------------------------
  // Keyword performance (28-day comparison)
  // -----------------------------------------------------------------------

  printDivider('KEYWORD PERFORMANCE (28-Day Comparison)')

  const currentKeywords = aggregateKeywordPeriod(keywords.current)
  const previousKeywords = aggregateKeywordPeriod(keywords.previous)

  if (currentKeywords.uniqueQueries === 0 && previousKeywords.uniqueQueries === 0) {
    console.log('\n  No keyword data available. GSC may not be syncing.')
  } else {
    console.log('\n  Current period vs. previous 28 days:\n')
    printChange('Unique keywords', currentKeywords.uniqueQueries, previousKeywords.uniqueQueries)
    printChange('Total clicks', currentKeywords.totalClicks, previousKeywords.totalClicks)
    printChange(
      'Total impressions',
      currentKeywords.totalImpressions,
      previousKeywords.totalImpressions,
    )
    printChange('Avg position', currentKeywords.avgPosition, previousKeywords.avgPosition, '', true)
  }

  // -----------------------------------------------------------------------
  // Action items
  // -----------------------------------------------------------------------

  printDivider('SPRINT ACTION ITEMS')

  const actions: string[] = []

  // Content in review
  if (inReview.length > 0) {
    actions.push(`Review and approve ${inReview.length} page(s) in "review" status`)
  }

  // Social posts in review
  const socialInReview = socialPosts.filter((p) => p.status === 'review')
  if (socialInReview.length > 0) {
    actions.push(`Approve ${socialInReview.length} social post(s) awaiting review`)
  }

  // Low SEO scores
  if (below70.length > 0) {
    actions.push(`Optimize ${below70.length} page(s) with SEO score below 70`)
  }

  // Blog content
  const publishedBlogs = content.blogPosts.filter((p) => p.status === 'published')
  if (publishedBlogs.length < 5) {
    actions.push(`Generate more blog posts (only ${publishedBlogs.length} published — target 10+)`)
  }

  // No recent content
  if (newContent.length === 0) {
    actions.push('Create new content — no pages generated during this sprint window')
  }

  // Run GSC/GA4 sync
  actions.push('Run GSC + GA4 manual sync to capture latest data')

  console.log('')
  for (let i = 0; i < actions.length; i++) {
    console.log(`  ${i + 1}. ${actions[i]}`)
  }

  // -----------------------------------------------------------------------
  // Sprint scorecard
  // -----------------------------------------------------------------------

  printDivider('SPRINT SCORECARD')

  const metrics = [
    { label: 'New content created', value: newContent.length, target: 3, unit: 'pages' },
    { label: 'Content updated/optimized', value: updatedContent.length, target: 10, unit: 'pages' },
    { label: 'Avg SEO score', value: avgScore, target: 85, unit: 'pts' },
    { label: 'Social posts created', value: recentSocial.length, target: 12, unit: 'posts' },
    { label: 'Calendar entries', value: calendarEntries.length, target: 12, unit: 'entries' },
    { label: 'Published pages', value: published.length, target: 25, unit: 'pages' },
  ]

  console.log('')
  console.log('  ' + 'Metric'.padEnd(30) + 'Actual'.padStart(8) + 'Target'.padStart(8) + '  Status')
  console.log('  ' + '-'.repeat(56))

  for (const m of metrics) {
    const met = m.value >= m.target
    const status = met ? 'MET' : 'MISS'
    console.log(
      '  ' +
        m.label.padEnd(30) +
        `${m.value}`.padStart(8) +
        `${m.target}`.padStart(8) +
        `  ${status}`,
    )
  }

  const metCount = metrics.filter((m) => m.value >= m.target).length
  console.log(`\n  Score: ${metCount}/${metrics.length} targets met`)

  // -----------------------------------------------------------------------
  // Next sprint prep
  // -----------------------------------------------------------------------

  printDivider('NEXT SPRINT PREPARATION')

  console.log(`
  Before the next monthly sprint:

  1. Approve all "review" content in the dashboard
  2. Run GSC + GA4 manual sync (Settings > Integrations > Sync Now)
  3. Wait 7-14 days for Google to index new pages
  4. Check GSC indexing coverage for new page status
  5. Monitor keyword position changes for striking-distance keywords
  6. Run Phase 0 baseline again to measure sprint impact

  Recommended next sprint date: ${(() => {
    const d = new Date()
    d.setDate(d.getDate() + 30)
    return d.toISOString().slice(0, 10)
  })()}
`)

  console.log('=== Phase 5 Complete — Sprint Finished ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
