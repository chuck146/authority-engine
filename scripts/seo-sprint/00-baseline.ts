/**
 * SEO Growth Sprint — Phase 0: Baseline Data Gathering
 *
 * Queries Supabase directly for keyword rankings, GA4 metrics, content pages,
 * and GSC snapshots. Computes and prints a comprehensive baseline report.
 *
 * Usage:
 *   npx tsx scripts/seo-sprint/00-baseline.ts
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const today = daysAgo(0)
const twentyEightDaysAgo = daysAgo(28)

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
  published_at: string | null
  meta_title: string | null
  meta_description: string | null
}

type LocationRow = ContentRow & { city: string; state: string }

type KeywordRow = {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  date: string
}

type Ga4Row = {
  page_path: string
  sessions: number
  users: number
  pageviews: number
  bounce_rate: number
  date: string
}

type GscSnapshot = {
  snapshot_date: string
  data: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchContentPages() {
  const [services, locations, blogs] = await Promise.all([
    supabase
      .from('service_pages')
      .select(
        'id, title, slug, status, seo_score, keywords, published_at, meta_title, meta_description',
      )
      .eq('organization_id', ORG_ID)
      .order('title')
      .returns<ContentRow[]>(),
    supabase
      .from('location_pages')
      .select(
        'id, title, slug, status, seo_score, keywords, published_at, meta_title, meta_description, city, state',
      )
      .eq('organization_id', ORG_ID)
      .order('title')
      .returns<LocationRow[]>(),
    supabase
      .from('blog_posts')
      .select(
        'id, title, slug, status, seo_score, keywords, published_at, meta_title, meta_description',
      )
      .eq('organization_id', ORG_ID)
      .order('title')
      .returns<ContentRow[]>(),
  ])

  if (services.error) throw new Error(`Service pages fetch failed: ${services.error.message}`)
  if (locations.error) throw new Error(`Location pages fetch failed: ${locations.error.message}`)
  if (blogs.error) throw new Error(`Blog posts fetch failed: ${blogs.error.message}`)

  return {
    servicePages: services.data ?? [],
    locationPages: locations.data as LocationRow[],
    blogPosts: blogs.data ?? [],
  }
}

async function fetchKeywordRankings() {
  const { data, error } = await supabase
    .from('keyword_rankings')
    .select('query, clicks, impressions, ctr, position, date')
    .eq('organization_id', ORG_ID)
    .gte('date', twentyEightDaysAgo)
    .lte('date', today)
    .returns<KeywordRow[]>()

  if (error) throw new Error(`Keyword rankings fetch failed: ${error.message}`)
  return data ?? []
}

async function fetchGa4Metrics() {
  const { data, error } = await supabase
    .from('ga4_page_metrics')
    .select('page_path, sessions, users, pageviews, bounce_rate, date')
    .eq('organization_id', ORG_ID)
    .gte('date', twentyEightDaysAgo)
    .lte('date', today)
    .returns<Ga4Row[]>()

  if (error) throw new Error(`GA4 metrics fetch failed: ${error.message}`)
  return data ?? []
}

async function fetchGscSnapshots() {
  const { data, error } = await supabase
    .from('gsc_snapshots')
    .select('snapshot_date, data')
    .eq('organization_id', ORG_ID)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .returns<GscSnapshot[]>()

  if (error) throw new Error(`GSC snapshots fetch failed: ${error.message}`)
  return data?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Analysis functions
// ---------------------------------------------------------------------------

type AggregatedKeyword = {
  query: string
  avgPosition: number
  totalClicks: number
  totalImpressions: number
  avgCtr: number
}

function aggregateKeywords(rows: KeywordRow[]): AggregatedKeyword[] {
  const map = new Map<
    string,
    { clicks: number; impressions: number; posSum: number; count: number }
  >()

  for (const row of rows) {
    const existing = map.get(row.query)
    if (existing) {
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.posSum += row.position
      existing.count += 1
    } else {
      map.set(row.query, {
        clicks: row.clicks,
        impressions: row.impressions,
        posSum: row.position,
        count: 1,
      })
    }
  }

  return Array.from(map.entries())
    .map(([query, d]) => ({
      query,
      avgPosition: Math.round((d.posSum / d.count) * 10) / 10,
      totalClicks: d.clicks,
      totalImpressions: d.impressions,
      avgCtr: d.impressions > 0 ? Math.round((d.clicks / d.impressions) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.totalClicks - a.totalClicks)
}

type AggregatedPage = {
  pagePath: string
  totalSessions: number
  totalPageviews: number
  avgBounceRate: number
}

function aggregateGa4(rows: Ga4Row[]): AggregatedPage[] {
  const map = new Map<
    string,
    { sessions: number; pageviews: number; bounceSum: number; count: number }
  >()

  for (const row of rows) {
    const existing = map.get(row.page_path)
    if (existing) {
      existing.sessions += row.sessions
      existing.pageviews += row.pageviews
      existing.bounceSum += row.bounce_rate
      existing.count += 1
    } else {
      map.set(row.page_path, {
        sessions: row.sessions,
        pageviews: row.pageviews,
        bounceSum: row.bounce_rate,
        count: 1,
      })
    }
  }

  return Array.from(map.entries())
    .map(([pagePath, d]) => ({
      pagePath,
      totalSessions: d.sessions,
      totalPageviews: d.pageviews,
      avgBounceRate: Math.round((d.bounceSum / d.count) * 100) / 100,
    }))
    .sort((a, b) => b.totalSessions - a.totalSessions)
}

function findStrikingDistanceKeywords(keywords: AggregatedKeyword[]): AggregatedKeyword[] {
  return keywords
    .filter((k) => k.avgPosition >= 11 && k.avgPosition <= 30)
    .sort((a, b) => a.avgPosition - b.avgPosition)
}

function findHighImpressionLowCtr(keywords: AggregatedKeyword[]): AggregatedKeyword[] {
  return keywords
    .filter((k) => k.avgCtr < 2 && k.totalImpressions > 50)
    .sort((a, b) => b.totalImpressions - a.totalImpressions)
}

function findMissingServiceLocationCombos(
  servicePages: ContentRow[],
  locationPages: LocationRow[],
): { service: string; city: string }[] {
  const publishedServices = servicePages
    .filter((s) => s.status === 'published')
    .map((s) => s.title.replace(/ Services?$/i, '').trim())

  const publishedCities = locationPages
    .filter((l) => l.status === 'published')
    .map((l) => (l as LocationRow).city)

  // Check which service x city combos have a dedicated location page
  // Location pages typically cover "Painting in [City]" — not per-service-per-city
  // So we look for cities that don't have ANY location page
  const citiesWithPages = new Set(publishedCities)

  // Potential expansion cities in the NJ service area
  const potentialCities = [
    'Bernardsville',
    'Berkeley Heights',
    'Clark',
    'Fanwood',
    'Garwood',
    'Glen Ridge',
    'Kenilworth',
    'Livingston',
    'Millburn',
    'Mountain Lakes',
    'Mountainside',
    'North Caldwell',
    'Nutley',
    'Rahway',
    'Roselle',
    'South Orange',
    'Springfield',
    'Union',
    'Verona',
    'Wayne',
    'West Caldwell',
    'West Orange',
    'Florham Park',
    'Boonton',
  ]

  const missing: { service: string; city: string }[] = []
  for (const city of potentialCities) {
    if (!citiesWithPages.has(city)) {
      missing.push({ service: publishedServices[0] ?? 'Painting', city })
    }
  }

  return missing
}

// ---------------------------------------------------------------------------
// Report printer
// ---------------------------------------------------------------------------

function printDivider(title: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(70))
}

function printContentSummary(
  servicePages: ContentRow[],
  locationPages: LocationRow[],
  blogPosts: ContentRow[],
) {
  printDivider('CONTENT OVERVIEW')

  const allContent = [
    ...servicePages.map((p) => ({ ...p, type: 'service_page' })),
    ...locationPages.map((p) => ({ ...p, type: 'location_page' })),
    ...blogPosts.map((p) => ({ ...p, type: 'blog_post' })),
  ]

  const published = allContent.filter((p) => p.status === 'published')
  const review = allContent.filter((p) => p.status === 'review')
  const draft = allContent.filter((p) => p.status === 'draft')

  console.log(`\n  Total pages: ${allContent.length}`)
  console.log(`  Published:   ${published.length}`)
  console.log(`  In review:   ${review.length}`)
  console.log(`  Draft:       ${draft.length}`)

  // By type
  const types = [
    { label: 'Service Pages', items: servicePages },
    { label: 'Location Pages', items: locationPages },
    { label: 'Blog Posts', items: blogPosts },
  ]

  console.log('\n  By type:')
  for (const { label, items } of types) {
    const pub = items.filter((i) => i.status === 'published')
    const pubScores = pub.filter((i) => i.seo_score != null).map((i) => i.seo_score!)
    const avgScore =
      pubScores.length > 0 ? Math.round(pubScores.reduce((a, b) => a + b, 0) / pubScores.length) : 0
    console.log(
      `    ${label}: ${items.length} total, ${pub.length} published, avg SEO: ${avgScore}`,
    )
  }

  // Pages in review — ACTION NEEDED
  if (review.length > 0) {
    console.log('\n  *** PAGES STUCK IN REVIEW (action needed): ***')
    for (const page of review) {
      console.log(
        `    - ${page.title} (${page.type}, SEO: ${page.seo_score ?? 'N/A'}, slug: ${page.slug})`,
      )
    }
  }

  // Pages with SEO score below 85
  const lowScoring = allContent
    .filter((p) => p.seo_score != null && p.seo_score < 85)
    .sort((a, b) => (a.seo_score ?? 0) - (b.seo_score ?? 0))

  if (lowScoring.length > 0) {
    console.log('\n  Pages with SEO score below 85:')
    for (const page of lowScoring) {
      console.log(
        `    - ${page.title} (${page.type}, SEO: ${page.seo_score}, status: ${page.status})`,
      )
    }
  } else {
    console.log('\n  All scored pages are 85+')
  }
}

function printKeywordAnalysis(keywords: AggregatedKeyword[]) {
  printDivider('KEYWORD RANKINGS (Last 28 Days)')

  if (keywords.length === 0) {
    console.log('\n  No keyword data found. GSC may not be syncing.')
    return
  }

  console.log(`\n  Total unique keywords tracked: ${keywords.length}`)

  const totalClicks = keywords.reduce((s, k) => s + k.totalClicks, 0)
  const totalImpressions = keywords.reduce((s, k) => s + k.totalImpressions, 0)
  const overallCtr =
    totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0

  console.log(`  Total clicks:      ${totalClicks.toLocaleString()}`)
  console.log(`  Total impressions: ${totalImpressions.toLocaleString()}`)
  console.log(`  Overall CTR:       ${overallCtr}%`)

  // Top 10 by clicks
  console.log('\n  Top 10 keywords by clicks:')
  console.log(
    '    ' +
      'Query'.padEnd(45) +
      'Pos'.padStart(6) +
      'Clicks'.padStart(8) +
      'Impr'.padStart(8) +
      'CTR'.padStart(7),
  )
  console.log('    ' + '-'.repeat(74))
  for (const k of keywords.slice(0, 10)) {
    console.log(
      '    ' +
        k.query.slice(0, 44).padEnd(45) +
        k.avgPosition.toFixed(1).padStart(6) +
        k.totalClicks.toString().padStart(8) +
        k.totalImpressions.toString().padStart(8) +
        `${k.avgCtr}%`.padStart(7),
    )
  }

  // Striking distance
  const strikingDistance = findStrikingDistanceKeywords(keywords)
  console.log(`\n  Striking-distance keywords (positions 11-30): ${strikingDistance.length}`)
  if (strikingDistance.length > 0) {
    console.log(
      '    ' + 'Query'.padEnd(45) + 'Pos'.padStart(6) + 'Clicks'.padStart(8) + 'Impr'.padStart(8),
    )
    console.log('    ' + '-'.repeat(67))
    for (const k of strikingDistance.slice(0, 15)) {
      console.log(
        '    ' +
          k.query.slice(0, 44).padEnd(45) +
          k.avgPosition.toFixed(1).padStart(6) +
          k.totalClicks.toString().padStart(8) +
          k.totalImpressions.toString().padStart(8),
      )
    }
  }

  // High impression, low CTR
  const lowCtr = findHighImpressionLowCtr(keywords)
  console.log(`\n  High-impression, low-CTR keywords (<2% CTR, >50 impressions): ${lowCtr.length}`)
  if (lowCtr.length > 0) {
    console.log(
      '    ' + 'Query'.padEnd(45) + 'Pos'.padStart(6) + 'Impr'.padStart(8) + 'CTR'.padStart(7),
    )
    console.log('    ' + '-'.repeat(66))
    for (const k of lowCtr.slice(0, 10)) {
      console.log(
        '    ' +
          k.query.slice(0, 44).padEnd(45) +
          k.avgPosition.toFixed(1).padStart(6) +
          k.totalImpressions.toString().padStart(8) +
          `${k.avgCtr}%`.padStart(7),
      )
    }
  }
}

function printGa4Analysis(pages: AggregatedPage[]) {
  printDivider('GA4 PAGE METRICS (Last 28 Days)')

  if (pages.length === 0) {
    console.log('\n  No GA4 data found. GA4 may not be syncing.')
    return
  }

  const totalSessions = pages.reduce((s, p) => s + p.totalSessions, 0)
  const totalPageviews = pages.reduce((s, p) => s + p.totalPageviews, 0)

  console.log(`\n  Total pages with data: ${pages.length}`)
  console.log(`  Total sessions:       ${totalSessions.toLocaleString()}`)
  console.log(`  Total pageviews:      ${totalPageviews.toLocaleString()}`)

  console.log('\n  Top 15 pages by sessions:')
  console.log(
    '    ' +
      'Page'.padEnd(45) +
      'Sessions'.padStart(10) +
      'Pageviews'.padStart(10) +
      'Bounce'.padStart(8),
  )
  console.log('    ' + '-'.repeat(73))
  for (const p of pages.slice(0, 15)) {
    console.log(
      '    ' +
        p.pagePath.slice(0, 44).padEnd(45) +
        p.totalSessions.toString().padStart(10) +
        p.totalPageviews.toString().padStart(10) +
        `${(p.avgBounceRate * 100).toFixed(0)}%`.padStart(8),
    )
  }
}

function printGscSnapshot(snapshot: GscSnapshot | null) {
  printDivider('GSC INDEXING COVERAGE')

  if (!snapshot) {
    console.log('\n  No GSC snapshots found.')
    return
  }

  console.log(`\n  Latest snapshot: ${snapshot.snapshot_date}`)

  const data = snapshot.data as Record<string, unknown>
  if (data.indexing_coverage) {
    const coverage = data.indexing_coverage as Record<string, number>
    console.log(`  Valid (indexed):     ${coverage.valid ?? 'N/A'}`)
    console.log(`  Warnings:            ${coverage.warnings ?? 'N/A'}`)
    console.log(`  Errors:              ${coverage.errors ?? 'N/A'}`)
    console.log(`  Excluded:            ${coverage.excluded ?? 'N/A'}`)
  }

  if (data.sitemaps && Array.isArray(data.sitemaps)) {
    console.log(`\n  Sitemaps: ${data.sitemaps.length}`)
    for (const sm of data.sitemaps as Record<string, unknown>[]) {
      console.log(
        `    - ${sm.path ?? sm.url ?? 'unknown'} (submitted: ${sm.contents_submitted ?? '?'}, indexed: ${sm.contents_indexed ?? '?'})`,
      )
    }
  }
}

function printMissingCombos(servicePages: ContentRow[], locationPages: LocationRow[]) {
  printDivider('EXPANSION OPPORTUNITIES')

  const missing = findMissingServiceLocationCombos(servicePages, locationPages)

  const publishedLocations = locationPages.filter((l) => l.status === 'published')
  console.log(`\n  Current published location pages: ${publishedLocations.length}`)
  console.log(`  Cities covered: ${publishedLocations.map((l) => l.city).join(', ')}`)
  console.log(`\n  Potential expansion cities (no page yet): ${missing.length}`)
  if (missing.length > 0) {
    for (const m of missing.slice(0, 15)) {
      console.log(`    - ${m.city}, NJ`)
    }
    if (missing.length > 15) {
      console.log(`    ... and ${missing.length - 15} more`)
    }
  }
}

function printSummary(
  servicePages: ContentRow[],
  locationPages: LocationRow[],
  blogPosts: ContentRow[],
  keywords: AggregatedKeyword[],
  _ga4Pages: AggregatedPage[],
) {
  printDivider('SPRINT ACTION ITEMS')

  const review = [
    ...servicePages.filter((p) => p.status === 'review'),
    ...locationPages.filter((p) => p.status === 'review'),
    ...blogPosts.filter((p) => p.status === 'review'),
  ]

  const lowScoring = [
    ...servicePages.filter((p) => p.seo_score != null && p.seo_score < 85),
    ...locationPages.filter((p) => p.seo_score != null && p.seo_score < 85),
    ...blogPosts.filter((p) => p.seo_score != null && p.seo_score < 85),
  ]

  const strikingDistance = findStrikingDistanceKeywords(keywords)
  const lowCtr = findHighImpressionLowCtr(keywords)

  console.log('\n  Priority actions:')
  console.log(`  1. Publish ${review.length} pages stuck in review`)
  console.log(`  2. Optimize ${lowScoring.length} pages with SEO score below 85`)
  console.log(`  3. Target ${strikingDistance.length} striking-distance keywords (positions 11-30)`)
  console.log(`  4. Improve CTR for ${lowCtr.length} high-impression, low-CTR keywords`)
  console.log(
    `  5. Blog content critically thin — only ${blogPosts.filter((b) => b.status === 'published').length} published post(s)`,
  )
  console.log(`  6. Generate spring-themed content (exterior prep, deck staining, curb appeal)`)
  console.log(`  7. Distribute top content via 12 social posts (6 GBP, 3 IG, 3 FB)`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== SEO Growth Sprint — Phase 0: Baseline Report ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  console.log(`Org: Cleanest Painting LLC (${ORG_ID})`)
  console.log(`Period: ${twentyEightDaysAgo} to ${today}`)

  // Fetch all data in parallel
  const [content, keywordRows, ga4Rows, gscSnapshot] = await Promise.all([
    fetchContentPages(),
    fetchKeywordRankings(),
    fetchGa4Metrics(),
    fetchGscSnapshots(),
  ])

  const { servicePages, locationPages, blogPosts } = content

  // Aggregate
  const aggregatedKeywords = aggregateKeywords(keywordRows)
  const aggregatedGa4 = aggregateGa4(ga4Rows)

  // Print report sections
  printContentSummary(servicePages, locationPages, blogPosts)
  printKeywordAnalysis(aggregatedKeywords)
  printGa4Analysis(aggregatedGa4)
  printGscSnapshot(gscSnapshot)
  printMissingCombos(servicePages, locationPages)
  printSummary(servicePages, locationPages, blogPosts, aggregatedKeywords, aggregatedGa4)

  console.log('\n=== Phase 0 Complete ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
