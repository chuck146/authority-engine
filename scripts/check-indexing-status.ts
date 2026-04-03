/**
 * GSC Indexing Status Checker
 *
 * Queries Supabase for published pages and checks their Google indexing status
 * via the GSC URL Inspection API. Prints a color-coded terminal report.
 *
 * Usage:
 *   npx tsx scripts/check-indexing-status.ts                     # location pages (default)
 *   npx tsx scripts/check-indexing-status.ts --type=all           # all content types
 *   npx tsx scripts/check-indexing-status.ts --type=services      # just services
 *   npx tsx scripts/check-indexing-status.ts --type=commercial    # commercial services
 *   npx tsx scripts/check-indexing-status.ts --type=blog          # blog posts
 *   npx tsx scripts/check-indexing-status.ts --slug=woodbridge-nj-painting  # single page
 *   npx tsx scripts/check-indexing-status.ts --verbose            # full inspection details
 *   npx tsx scripts/check-indexing-status.ts --dry-run            # list URLs, no API calls
 *   npx tsx scripts/check-indexing-status.ts --delay=2            # seconds between requests
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GSC_ENCRYPTION_KEY,
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { getValidToken } from '@/lib/google/token-manager'
import { inspectUrl, fetchSitemaps, fetchSearchAnalytics } from '@/lib/google/search-console'
import type { UrlInspectionResult } from '@/types/gsc'

// ---------------------------------------------------------------------------
// ANSI Colors
// ---------------------------------------------------------------------------

const C = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const BASE_URL = 'https://cleanestpaintingnj.com'

type ContentType = 'locations' | 'services' | 'blog' | 'commercial'
const ALL_TYPES: ContentType[] = ['locations', 'services', 'blog', 'commercial']

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}

const typeArg = (flagMap.get('type') ?? 'locations') as ContentType | 'all'
const slugFilter = flagMap.get('slug') ?? null
const verbose = flagMap.has('verbose')
const dryRun = flagMap.has('dry-run')
const delayMs = parseFloat(flagMap.get('delay') ?? '1.5') * 1000

// ---------------------------------------------------------------------------
// Supabase client
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageEntry = {
  slug: string
  title: string
  type: ContentType
  publishedAt: string | null
}

type SearchAnalyticsData = {
  clicks: number
  impressions: number
  position: number
}

type InspectionEntry = {
  page: PageEntry
  result: UrlInspectionResult | null
  error: string | null
  searchAnalytics: SearchAnalyticsData | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return '1d ago'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function coverageLabel(state: string): { label: string; color: string; icon: string } {
  switch (state) {
    case 'SUBMITTED_AND_INDEXED':
      return { label: 'INDEXED', color: C.green, icon: '✓' }
    case 'CRAWLED_NOT_INDEXED':
      return { label: 'CRAWLED', color: C.yellow, icon: '⏳' }
    case 'DISCOVERED_NOT_INDEXED':
      return { label: 'DISCOVERED', color: C.yellow, icon: '⏳' }
    case 'DUPLICATE':
      return { label: 'DUPLICATE', color: C.cyan, icon: '⇔' }
    case 'URL_IS_UNKNOWN':
    default:
      return { label: 'UNKNOWN', color: C.red, icon: '✗' }
  }
}

function buildUrl(type: ContentType, slug: string): string {
  const pathMap: Record<ContentType, string> = {
    locations: 'locations',
    services: 'services',
    blog: 'blog',
    commercial: 'commercial',
  }
  return `${BASE_URL}/${pathMap[type]}/${slug}`
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const TABLE_MAP: Record<ContentType, string> = {
  locations: 'location_pages',
  services: 'service_pages',
  blog: 'blog_posts',
  commercial: 'commercial_service_pages',
}

async function fetchPublishedPages(
  types: ContentType[],
  slug?: string | null,
): Promise<PageEntry[]> {
  const pages: PageEntry[] = []

  for (const type of types) {
    const table = TABLE_MAP[type]
    let query = supabase
      .from(table)
      .select('slug, title, published_at')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published')
      .order('title', { ascending: true })

    if (slug) {
      query = query.eq('slug', slug)
    }

    const { data, error } = await query
    if (error) {
      console.error(`${C.red}Error querying ${table}: ${error.message}${C.reset}`)
      continue
    }

    for (const row of data ?? []) {
      pages.push({
        slug: row.slug,
        title: row.title,
        type,
        publishedAt: row.published_at,
      })
    }
  }

  return pages
}

// ---------------------------------------------------------------------------
// Response mapping (same as app/api/v1/gsc/url-inspection/route.ts lines 29-52)
// ---------------------------------------------------------------------------

function mapRawInspectionResult(url: string, raw: Record<string, unknown>): UrlInspectionResult {
  const inspection = raw.inspectionResult as Record<string, unknown> | undefined
  const indexStatus = inspection?.indexStatusResult as Record<string, unknown> | undefined
  const mobileResult = inspection?.mobileUsabilityResult as Record<string, unknown> | undefined
  const richResultsResult = inspection?.richResultsResult as Record<string, unknown> | undefined

  return {
    inspectionUrl: url,
    indexingState:
      (indexStatus?.indexingState as UrlInspectionResult['indexingState']) ?? 'UNKNOWN',
    coverageState: (indexStatus?.coverageState as string) ?? 'URL_IS_UNKNOWN',
    lastCrawlTime: (indexStatus?.lastCrawlTime as string) ?? null,
    crawlAllowed: (indexStatus?.crawledAs as string) !== 'CRAWLED_AS_NONE',
    robotsTxtState:
      (indexStatus?.robotsTxtState as UrlInspectionResult['robotsTxtState']) ?? 'UNKNOWN',
    pageFetchState: (indexStatus?.pageFetchState as string) ?? 'UNKNOWN',
    mobileUsability: (mobileResult?.verdict as UrlInspectionResult['mobileUsability']) ?? 'UNKNOWN',
    richResults: Array.isArray(richResultsResult?.detectedItems)
      ? (richResultsResult.detectedItems as UrlInspectionResult['richResults'])
      : [],
  }
}

// ---------------------------------------------------------------------------
// Inspect with retry
// ---------------------------------------------------------------------------

async function inspectWithRetry(
  url: string,
  accessToken: string,
  siteUrl: string,
  retries = 2,
): Promise<UrlInspectionResult> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const raw = await inspectUrl({ accessToken, siteUrl, inspectionUrl: url })
      return mapRawInspectionResult(url, raw)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const is429 = msg.includes('429')
      const isTransient = is429 || msg.includes('500') || msg.includes('503')

      if (isTransient && attempt < retries) {
        const waitMs = is429 ? 10000 : 3000
        console.log(`  ${C.gray}Retrying in ${waitMs / 1000}s (${msg})...${C.reset}`)
        await sleep(waitMs)
        continue
      }
      throw err
    }
  }
  throw new Error('Unreachable')
}

// ---------------------------------------------------------------------------
// Output formatting
// ---------------------------------------------------------------------------

function printResult(entry: InspectionEntry): void {
  const { page, result, error, searchAnalytics } = entry
  const path = `/${page.type === 'blog' ? 'blog' : page.type === 'commercial' ? 'commercial' : page.type === 'services' ? 'services' : 'locations'}/${page.slug}`

  if (error) {
    // Still show search analytics confirmation even on inspection error
    if (searchAnalytics) {
      console.log(
        `  ${C.green}✓ INDEXED${C.reset}    ${path} — ${C.green}Confirmed via search data${C.reset} (${searchAnalytics.impressions} impressions, ${searchAnalytics.clicks} clicks, pos ${searchAnalytics.position})`,
      )
    } else {
      console.log(`  ${C.red}✗ ERROR${C.reset}    ${path} — ${error}`)
    }
    return
  }

  if (!result) return

  // If search analytics has data for this page, it's definitively indexed
  const confirmedBySearch = !!searchAnalytics
  const cv = confirmedBySearch
    ? { label: 'INDEXED', color: C.green, icon: '✓' }
    : coverageLabel(result.coverageState)

  const crawl = result.lastCrawlTime
    ? `Crawled ${relativeTime(result.lastCrawlTime)}`
    : 'Not crawled yet'
  const mobile = result.mobileUsability === 'MOBILE_FRIENDLY' ? 'Mobile OK' : result.mobileUsability
  const rich =
    result.richResults.length > 0
      ? `${result.richResults.length} rich result${result.richResults.length > 1 ? 's' : ''}`
      : ''
  const searchInfo = searchAnalytics
    ? `${C.green}${searchAnalytics.impressions} imp, ${searchAnalytics.clicks} clicks, pos ${searchAnalytics.position}${C.reset}`
    : ''

  const parts = [crawl, mobile, rich, searchInfo].filter(Boolean).join(' — ')
  console.log(`  ${cv.color}${cv.icon} ${cv.label.padEnd(10)}${C.reset} ${path} — ${parts}`)

  if (verbose) {
    console.log(`    ${C.gray}Indexing State:  ${result.indexingState}${C.reset}`)
    console.log(`    ${C.gray}Coverage State:  ${result.coverageState}${C.reset}`)
    console.log(`    ${C.gray}Page Fetch:      ${result.pageFetchState}${C.reset}`)
    console.log(`    ${C.gray}Robots.txt:      ${result.robotsTxtState}${C.reset}`)
    console.log(
      `    ${C.gray}Last Crawl:      ${result.lastCrawlTime ?? 'N/A'} (${relativeTime(result.lastCrawlTime)})${C.reset}`,
    )
    console.log(`    ${C.gray}Mobile:          ${result.mobileUsability}${C.reset}`)
    if (result.richResults.length > 0) {
      const types = result.richResults
        .map((r) => `${r.richResultType} (${r.items.length})`)
        .join(', ')
      console.log(`    ${C.gray}Rich Results:    ${types}${C.reset}`)
    }
    if (searchAnalytics) {
      console.log(
        `    ${C.green}Search Data:     ${searchAnalytics.impressions} impressions, ${searchAnalytics.clicks} clicks, avg position ${searchAnalytics.position}${C.reset}`,
      )
    }
    console.log()
  }
}

function printSummary(entries: InspectionEntry[]): void {
  const total = entries.length
  // Count as indexed if: URL Inspection says so OR search analytics confirms it
  const confirmedBySearch = entries.filter((e) => e.searchAnalytics).length
  const indexedByApi = entries.filter(
    (e) => e.result?.coverageState === 'SUBMITTED_AND_INDEXED',
  ).length
  const indexed = entries.filter(
    (e) => e.result?.coverageState === 'SUBMITTED_AND_INDEXED' || e.searchAnalytics,
  ).length
  const crawled = entries.filter(
    (e) => e.result?.coverageState === 'CRAWLED_NOT_INDEXED' && !e.searchAnalytics,
  ).length
  const discovered = entries.filter(
    (e) => e.result?.coverageState === 'DISCOVERED_NOT_INDEXED' && !e.searchAnalytics,
  ).length
  const unknown = entries.filter(
    (e) => (!e.result || e.result.coverageState === 'URL_IS_UNKNOWN') && !e.searchAnalytics,
  ).length
  const duplicate = entries.filter(
    (e) => e.result?.coverageState === 'DUPLICATE' && !e.searchAnalytics,
  ).length
  const errors = entries.filter((e) => e.error && !e.searchAnalytics).length
  const mobileFriendly = entries.filter(
    (e) => e.result?.mobileUsability === 'MOBILE_FRIENDLY',
  ).length
  const withRichResults = entries.filter((e) => (e.result?.richResults.length ?? 0) > 0).length

  const pct = (n: number) => (total > 0 ? `(${((n / total) * 100).toFixed(1)}%)` : '')
  const bar = (n: number) => {
    const width = 20
    const filled = total > 0 ? Math.round((n / total) * width) : 0
    return '█'.repeat(filled) + '░'.repeat(width - filled)
  }

  console.log(`\n${C.bold}=== Indexing Status Summary ===${C.reset}\n`)
  console.log(`  Total pages checked:  ${total}`)
  console.log(
    `  ${C.green}Indexed:              ${String(indexed).padStart(3)}  ${pct(indexed).padStart(8)}  ${bar(indexed)}${C.reset}`,
  )
  if (confirmedBySearch > 0 || indexedByApi > 0) {
    console.log(
      `    ${C.gray}↳ ${confirmedBySearch} confirmed via search analytics, ${indexedByApi} via URL Inspection API${C.reset}`,
    )
  }
  if (crawled > 0)
    console.log(
      `  ${C.yellow}Crawled not indexed:  ${String(crawled).padStart(3)}  ${pct(crawled).padStart(8)}  ${bar(crawled)}${C.reset}`,
    )
  if (discovered > 0)
    console.log(
      `  ${C.yellow}Discovered:           ${String(discovered).padStart(3)}  ${pct(discovered).padStart(8)}  ${bar(discovered)}${C.reset}`,
    )
  if (unknown > 0)
    console.log(
      `  ${C.red}Unknown:              ${String(unknown).padStart(3)}  ${pct(unknown).padStart(8)}  ${bar(unknown)}${C.reset}`,
    )
  if (duplicate > 0)
    console.log(
      `  ${C.cyan}Duplicate:            ${String(duplicate).padStart(3)}  ${pct(duplicate).padStart(8)}  ${bar(duplicate)}${C.reset}`,
    )
  if (errors > 0)
    console.log(
      `  ${C.red}Errors:               ${String(errors).padStart(3)}  ${pct(errors).padStart(8)}  ${bar(errors)}${C.reset}`,
    )

  console.log()
  console.log(`  Mobile friendly:    ${String(mobileFriendly).padStart(3)}  ${pct(mobileFriendly)}`)
  console.log(
    `  Rich results:       ${String(withRichResults).padStart(3)}  ${pct(withRichResults)}`,
  )

  // Find most recent crawl and oldest uncrawled
  const crawlTimes = entries
    .filter((e) => e.result?.lastCrawlTime)
    .map((e) => ({ page: e.page, time: e.result!.lastCrawlTime! }))
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  if (crawlTimes.length > 0) {
    console.log(
      `\n  Most recent crawl:  ${relativeTime(crawlTimes[0]!.time)} (${crawlTimes[0]!.page.title})`,
    )
  }

  const uncrawled = entries.filter((e) => !e.result?.lastCrawlTime && !e.error)
  if (uncrawled.length > 0) {
    console.log(`  Not yet crawled:    ${uncrawled.map((e) => e.page.slug).join(', ')}`)
  }

  console.log()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Validate env vars
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GSC_ENCRYPTION_KEY']
  const missing = required.filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`${C.red}Missing env vars: ${missing.join(', ')}${C.reset}`)
    process.exit(1)
  }

  const types = typeArg === 'all' ? ALL_TYPES : [typeArg as ContentType]

  console.log(`\n${C.bold}=== GSC Indexing Status Check ===${C.reset}`)
  console.log(`  Type: ${typeArg}`)
  if (slugFilter) console.log(`  Slug: ${slugFilter}`)
  if (dryRun) console.log(`  ${C.yellow}DRY RUN — no API calls${C.reset}`)
  console.log()

  // Fetch published pages
  const pages = await fetchPublishedPages(types, slugFilter)

  if (pages.length === 0) {
    console.log(`${C.yellow}No published pages found.${C.reset}`)
    process.exit(0)
  }

  console.log(`  Found ${pages.length} published page${pages.length > 1 ? 's' : ''}\n`)

  // Dry run: just list URLs
  if (dryRun) {
    for (const page of pages) {
      const url = buildUrl(page.type, page.slug)
      console.log(`  ${C.gray}${page.type.padEnd(12)}${C.reset} ${url}`)
    }
    console.log(`\n  ${C.gray}${pages.length} URLs would be inspected${C.reset}\n`)
    return
  }

  // Get GSC token
  let accessToken: string
  let siteUrl: string
  try {
    const token = await getValidToken(ORG_ID, 'search_console')
    accessToken = token.accessToken
    siteUrl = token.siteUrl
  } catch (err) {
    console.error(
      `${C.red}Failed to get GSC token: ${err instanceof Error ? err.message : err}${C.reset}`,
    )
    console.error(`${C.gray}Tip: Reconnect GSC in Settings → Integrations${C.reset}`)
    process.exit(1)
  }

  console.log(`  ${C.gray}GSC property: ${siteUrl}${C.reset}`)
  console.log(`  ${C.gray}Delay: ${delayMs / 1000}s between requests${C.reset}\n`)

  // ---------------------------------------------------------------------------
  // Sitemap summary (matches GSC dashboard "Page indexing" numbers)
  // ---------------------------------------------------------------------------

  try {
    const sitemaps = await fetchSitemaps({ accessToken, siteUrl })
    const activeSitemaps = sitemaps.filter((s) => s.contents && s.contents.length > 0)
    if (activeSitemaps.length > 0) {
      console.log(`  ${C.bold}--- Sitemap Summary (GSC Dashboard) ---${C.reset}`)
      for (const sm of activeSitemaps) {
        const webContent = sm.contents?.find((c) => c.type === 'web')
        if (webContent) {
          const submitted = parseInt(webContent.submitted, 10)
          const indexed = parseInt(webContent.indexed, 10)
          const pct = submitted > 0 ? ((indexed / submitted) * 100).toFixed(1) : '0'
          console.log(`  ${C.green}${sm.path}${C.reset}`)
          console.log(
            `    Submitted: ${submitted}  |  ${C.green}Indexed: ${indexed} (${pct}%)${C.reset}`,
          )
          if (sm.lastDownloaded) {
            console.log(
              `    ${C.gray}Last downloaded: ${relativeTime(sm.lastDownloaded)}${C.reset}`,
            )
          }
        }
      }
      console.log()
    }
  } catch (err) {
    console.log(
      `  ${C.yellow}Could not fetch sitemaps: ${err instanceof Error ? err.message : err}${C.reset}\n`,
    )
  }

  // ---------------------------------------------------------------------------
  // Search Analytics cross-reference (pages with impressions = confirmed indexed)
  // ---------------------------------------------------------------------------

  const indexedBySearchAnalytics = new Map<
    string,
    { clicks: number; impressions: number; position: number }
  >()

  try {
    const now = new Date()
    const endDate = now.toISOString().split('T')[0]!
    const startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]!

    const analyticsData = await fetchSearchAnalytics({
      accessToken,
      siteUrl,
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 1000,
    })

    if (analyticsData.rows) {
      for (const row of analyticsData.rows) {
        const pageUrl = row.keys[0]!
        indexedBySearchAnalytics.set(pageUrl, {
          clicks: row.clicks,
          impressions: row.impressions,
          position: Math.round(row.position * 10) / 10,
        })
      }
      console.log(`  ${C.bold}--- Search Analytics (28d) ---${C.reset}`)
      console.log(
        `  ${C.green}${indexedBySearchAnalytics.size} pages with search impressions (confirmed indexed)${C.reset}\n`,
      )
    }
  } catch (err) {
    console.log(
      `  ${C.yellow}Could not fetch search analytics: ${err instanceof Error ? err.message : err}${C.reset}\n`,
    )
  }

  // Inspect each page
  const entries: InspectionEntry[] = []

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!
    const url = buildUrl(page.type, page.slug)

    const sa = indexedBySearchAnalytics.get(url) ?? null

    try {
      const result = await inspectWithRetry(url, accessToken, siteUrl)
      const entry: InspectionEntry = { page, result, error: null, searchAnalytics: sa }
      entries.push(entry)
      printResult(entry)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      const entry: InspectionEntry = { page, result: null, error: errorMsg, searchAnalytics: sa }
      entries.push(entry)
      printResult(entry)
    }

    // Delay between requests (skip after last)
    if (i < pages.length - 1) {
      await sleep(delayMs)
    }
  }

  // Print summary
  printSummary(entries)
}

main().catch((err) => {
  console.error(`${C.red}Fatal error: ${err instanceof Error ? err.message : err}${C.reset}`)
  process.exit(1)
})
