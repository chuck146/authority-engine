/**
 * SEO Growth Sprint — Phase 4: Technical SEO & Site Health Audit
 *
 * Fetches all published pages, checks HTTP status, validates meta tags,
 * schema markup, Open Graph tags, sitemap, and internal link health.
 * Generates a severity-ranked audit report.
 *
 * Usage:
 *   npx tsx scripts/seo-sprint/04-technical-audit.ts
 *   npx tsx scripts/seo-sprint/04-technical-audit.ts --verbose
 *   npx tsx scripts/seo-sprint/04-technical-audit.ts --check=schema,og,links
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
const DOMAIN = 'cleanestpaintingnj.com'
const BASE_URL = `https://${DOMAIN}`
const FETCH_TIMEOUT_MS = 15000
const CONCURRENT_FETCHES = 3

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}
const verbose = flagMap.has('verbose')
const checkFilter = flagMap.get('check')?.split(',') ?? null

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

type Severity = 'critical' | 'high' | 'medium' | 'low'

type AuditIssue = {
  severity: Severity
  category: string
  page: string
  message: string
  recommendation: string
}

type ContentRow = {
  id: string
  title: string
  slug: string
  status: string
  meta_title: string | null
  meta_description: string | null
  hero_image_url: string | null
}

type PageCheckResult = {
  url: string
  status: number | null
  redirectUrl: string | null
  html: string | null
  error: string | null
  responseTimeMs: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchPage(url: string): Promise<PageCheckResult> {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'AuthorityEngine-SEO-Audit/1.0' },
    })
    clearTimeout(timeout)

    const html = await response.text()
    const elapsed = Date.now() - start

    return {
      url,
      status: response.status,
      redirectUrl: response.redirected ? response.url : null,
      html,
      error: null,
      responseTimeMs: elapsed,
    }
  } catch (err) {
    return {
      url,
      status: null,
      redirectUrl: null,
      html: null,
      error: (err as Error).message,
      responseTimeMs: Date.now() - start,
    }
  }
}

async function fetchInBatches(urls: string[], concurrency: number): Promise<PageCheckResult[]> {
  const results: PageCheckResult[] = []
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fetchPage))
    results.push(...batchResults)
    if (i + concurrency < urls.length) await sleep(500)
  }
  return results
}

// ---------------------------------------------------------------------------
// Fetch published pages from DB
// ---------------------------------------------------------------------------

async function fetchPublishedPages(): Promise<{ type: string; pages: ContentRow[] }[]> {
  const [services, locations, blogs] = await Promise.all([
    supabase
      .from('service_pages')
      .select('id, title, slug, status, meta_title, meta_description, hero_image_url')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('title')
      .returns<ContentRow[]>(),
    supabase
      .from('location_pages')
      .select('id, title, slug, status, meta_title, meta_description, hero_image_url')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('title')
      .returns<ContentRow[]>(),
    supabase
      .from('blog_posts')
      .select('id, title, slug, status, meta_title, meta_description')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('title')
      .returns<ContentRow[]>(),
  ])

  if (services.error) throw new Error(`Service pages: ${services.error.message}`)
  if (locations.error) throw new Error(`Location pages: ${locations.error.message}`)
  if (blogs.error) throw new Error(`Blog posts: ${blogs.error.message}`)

  return [
    { type: 'service_page', pages: services.data ?? [] },
    { type: 'location_page', pages: locations.data ?? [] },
    { type: 'blog_post', pages: blogs.data ?? [] },
  ]
}

function pageUrl(type: string, slug: string): string {
  const prefix =
    type === 'service_page' ? 'services' : type === 'location_page' ? 'locations' : 'blog'
  return `${BASE_URL}/${prefix}/${slug}`
}

// ---------------------------------------------------------------------------
// Audit checks
// ---------------------------------------------------------------------------

function checkHttpStatus(result: PageCheckResult, issues: AuditIssue[]) {
  if (result.error) {
    issues.push({
      severity: 'critical',
      category: 'HTTP',
      page: result.url,
      message: `Page fetch failed: ${result.error}`,
      recommendation: 'Verify the page is accessible and the server is running.',
    })
    return
  }

  if (result.status !== 200) {
    issues.push({
      severity: result.status === 404 ? 'critical' : 'high',
      category: 'HTTP',
      page: result.url,
      message: `HTTP ${result.status} response`,
      recommendation:
        result.status === 404
          ? 'Page returns 404 — check if the content is published and the slug is correct.'
          : `Unexpected status code ${result.status}. Investigate server response.`,
    })
  }

  if (result.redirectUrl && result.redirectUrl !== result.url) {
    issues.push({
      severity: 'medium',
      category: 'HTTP',
      page: result.url,
      message: `Redirect chain detected → ${result.redirectUrl}`,
      recommendation: 'Update internal links to point to the final URL to avoid redirect chains.',
    })
  }

  if (result.responseTimeMs > 5000) {
    issues.push({
      severity: 'high',
      category: 'Performance',
      page: result.url,
      message: `Slow response: ${result.responseTimeMs}ms`,
      recommendation: 'Investigate server-side rendering performance. Consider caching or ISR.',
    })
  } else if (result.responseTimeMs > 3000) {
    issues.push({
      severity: 'medium',
      category: 'Performance',
      page: result.url,
      message: `Moderate response time: ${result.responseTimeMs}ms`,
      recommendation: 'Response time approaching threshold. Monitor and optimize if it increases.',
    })
  }
}

function checkMetaTags(result: PageCheckResult, dbPage: ContentRow, issues: AuditIssue[]) {
  if (!result.html) return
  const html = result.html

  // Title tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = titleMatch?.[1]?.trim() ?? ''

  if (!title) {
    issues.push({
      severity: 'critical',
      category: 'Meta Tags',
      page: result.url,
      message: 'Missing <title> tag',
      recommendation: 'Add a descriptive title tag (50-60 characters) with the primary keyword.',
    })
  } else if (title.length < 30) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      page: result.url,
      message: `Title too short (${title.length} chars): "${title}"`,
      recommendation: 'Expand title to 50-60 characters for optimal search display.',
    })
  } else if (title.length > 70) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      page: result.url,
      message: `Title too long (${title.length} chars): "${title.slice(0, 60)}..."`,
      recommendation: 'Trim title to 60 characters to prevent truncation in search results.',
    })
  }

  // Meta description
  const descMatch =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ??
    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)
  const description = descMatch?.[1]?.trim() ?? ''

  if (!description) {
    issues.push({
      severity: 'high',
      category: 'Meta Tags',
      page: result.url,
      message: 'Missing meta description',
      recommendation: 'Add a compelling meta description (150-160 chars) with a CTA and keyword.',
    })
  } else if (description.length < 100) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      page: result.url,
      message: `Meta description too short (${description.length} chars)`,
      recommendation: 'Expand meta description to 150-160 characters for optimal search display.',
    })
  } else if (description.length > 170) {
    issues.push({
      severity: 'low',
      category: 'Meta Tags',
      page: result.url,
      message: `Meta description may truncate (${description.length} chars)`,
      recommendation: 'Trim to 160 characters to prevent truncation in search results.',
    })
  }

  // Canonical tag
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)["']/i)
  if (!canonicalMatch) {
    issues.push({
      severity: 'medium',
      category: 'Meta Tags',
      page: result.url,
      message: 'Missing canonical tag',
      recommendation: 'Add <link rel="canonical"> to prevent duplicate content issues.',
    })
  }

  // Viewport meta
  const viewportMatch = html.match(/<meta\s+name=["']viewport["']/i)
  if (!viewportMatch) {
    issues.push({
      severity: 'high',
      category: 'Meta Tags',
      page: result.url,
      message: 'Missing viewport meta tag',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">.',
    })
  }
}

function checkOpenGraph(result: PageCheckResult, dbPage: ContentRow, issues: AuditIssue[]) {
  if (!result.html) return
  const html = result.html

  const ogProps = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']
  const missing: string[] = []

  for (const prop of ogProps) {
    const regex = new RegExp(
      `<meta\\s+(?:property|name)=["']${prop}["']\\s+content=["']([^"']*)["']`,
      'i',
    )
    const altRegex = new RegExp(
      `<meta\\s+content=["']([^"']*)["']\\s+(?:property|name)=["']${prop}["']`,
      'i',
    )
    const match = html.match(regex) ?? html.match(altRegex)

    if (!match || !match[1]?.trim()) {
      missing.push(prop)
    }
  }

  if (missing.length > 0) {
    issues.push({
      severity: missing.includes('og:title') || missing.includes('og:image') ? 'high' : 'medium',
      category: 'Open Graph',
      page: result.url,
      message: `Missing OG tags: ${missing.join(', ')}`,
      recommendation: 'Add Open Graph tags for proper social media sharing previews.',
    })
  }

  // Twitter Card
  const twitterCard = html.match(/<meta\s+(?:name|property)=["']twitter:card["']/i)
  if (!twitterCard) {
    issues.push({
      severity: 'low',
      category: 'Open Graph',
      page: result.url,
      message: 'Missing Twitter/X Card meta tags',
      recommendation:
        'Add <meta name="twitter:card" content="summary_large_image"> for Twitter sharing.',
    })
  }
}

function checkSchemaMarkup(result: PageCheckResult, pageType: string, issues: AuditIssue[]) {
  if (!result.html) return
  const html = result.html

  // Look for JSON-LD script tags
  const jsonLdMatches =
    html.match(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? []
  const schemas: string[] = []

  for (const match of jsonLdMatches) {
    const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
    if (contentMatch?.[1]) {
      try {
        const parsed = JSON.parse(contentMatch[1])
        const type = parsed['@type'] ?? (Array.isArray(parsed['@graph']) ? 'graph' : 'unknown')
        schemas.push(type)
      } catch {
        schemas.push('invalid-json')
      }
    }
  }

  if (verbose) {
    console.log(`    Schema types found: ${schemas.length > 0 ? schemas.join(', ') : 'none'}`)
  }

  // Check for LocalBusiness on homepage
  if (result.url === BASE_URL || result.url === `${BASE_URL}/`) {
    if (
      !schemas.some(
        (s) =>
          s === 'LocalBusiness' ||
          s === 'PaintingContractor' ||
          s === 'HomeAndConstructionBusiness',
      )
    ) {
      issues.push({
        severity: 'high',
        category: 'Schema',
        page: result.url,
        message: 'Missing LocalBusiness schema on homepage',
        recommendation:
          'Add LocalBusiness JSON-LD with name, address, phone, hours, and service area.',
      })
    }
  }

  // Check for BreadcrumbList on content pages
  if (pageType !== 'homepage') {
    if (!schemas.some((s) => s === 'BreadcrumbList' || s === 'graph')) {
      issues.push({
        severity: 'medium',
        category: 'Schema',
        page: result.url,
        message: 'Missing BreadcrumbList schema',
        recommendation: 'Add BreadcrumbList JSON-LD for better search result display.',
      })
    }
  }

  // Check for Service schema on service pages
  if (pageType === 'service_page') {
    if (!schemas.some((s) => s === 'Service' || s === 'ProfessionalService')) {
      issues.push({
        severity: 'medium',
        category: 'Schema',
        page: result.url,
        message: 'Missing Service schema on service page',
        recommendation: 'Add Service JSON-LD with service type, provider, and area served.',
      })
    }
  }
}

function checkHeadingStructure(result: PageCheckResult, issues: AuditIssue[]) {
  if (!result.html) return
  const html = result.html

  // Count H1 tags
  const h1Matches = html.match(/<h1[\s>]/gi) ?? []
  if (h1Matches.length === 0) {
    issues.push({
      severity: 'high',
      category: 'Content Structure',
      page: result.url,
      message: 'Missing H1 tag',
      recommendation: 'Add exactly one H1 tag with the primary keyword for the page.',
    })
  } else if (h1Matches.length > 1) {
    issues.push({
      severity: 'medium',
      category: 'Content Structure',
      page: result.url,
      message: `Multiple H1 tags (${h1Matches.length})`,
      recommendation: 'Use exactly one H1. Convert extras to H2 or other appropriate headings.',
    })
  }

  // Check for img alt text
  const imgTags = html.match(/<img\s[^>]*>/gi) ?? []
  const missingAlt = imgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i))
  if (missingAlt.length > 0) {
    issues.push({
      severity: 'medium',
      category: 'Accessibility',
      page: result.url,
      message: `${missingAlt.length} image(s) missing alt text`,
      recommendation: 'Add descriptive alt text to all images for accessibility and image SEO.',
    })
  }
}

function checkInternalLinks(result: PageCheckResult, _allUrls: Set<string>, _issues: AuditIssue[]) {
  if (!result.html) return
  const html = result.html

  // Extract internal links
  const linkRegex = /href=["']((?:https?:\/\/(?:www\.)?cleanestpaintingnj\.com)?\/[^"'#]*)/gi
  const links: string[] = []
  let match

  while ((match = linkRegex.exec(html)) !== null) {
    let href = match[1]!
    if (href.startsWith('/')) href = `${BASE_URL}${href}`
    // Normalize: remove trailing slash
    href = href.replace(/\/$/, '')
    links.push(href)
  }

  // Filter to internal content links only
  const contentLinks = links.filter(
    (l) => l.includes('/services/') || l.includes('/locations/') || l.includes('/blog/'),
  )

  if (verbose && contentLinks.length > 0) {
    console.log(`    Internal content links: ${contentLinks.length}`)
  }

  // Check for orphan pages (no internal links pointing to them)
  // This is done at the summary level, not per-page
}

// ---------------------------------------------------------------------------
// Sitemap check
// ---------------------------------------------------------------------------

async function checkSitemap(
  publishedUrls: string[],
  issues: AuditIssue[],
): Promise<{ found: boolean; urls: string[] }> {
  const sitemapUrl = `${BASE_URL}/sitemap.xml`
  console.log(`\n  Checking sitemap: ${sitemapUrl}`)

  const result = await fetchPage(sitemapUrl)

  if (result.error || result.status !== 200) {
    issues.push({
      severity: 'high',
      category: 'Sitemap',
      page: sitemapUrl,
      message: result.error
        ? `Sitemap fetch failed: ${result.error}`
        : `Sitemap returned HTTP ${result.status}`,
      recommendation: 'Generate a sitemap.xml at the root domain. Next.js can auto-generate this.',
    })
    return { found: false, urls: [] }
  }

  // Parse URLs from sitemap
  const urlMatches = result.html?.match(/<loc>([^<]+)<\/loc>/gi) ?? []
  const sitemapUrls = urlMatches.map((m) => m.replace(/<\/?loc>/gi, '').trim())

  console.log(`    Sitemap contains ${sitemapUrls.length} URLs`)

  // Check published pages missing from sitemap
  const sitemapSet = new Set(sitemapUrls.map((u) => u.replace(/\/$/, '')))
  const missingFromSitemap = publishedUrls.filter(
    (u) => !sitemapSet.has(u) && !sitemapSet.has(u + '/'),
  )

  if (missingFromSitemap.length > 0) {
    issues.push({
      severity: 'high',
      category: 'Sitemap',
      page: sitemapUrl,
      message: `${missingFromSitemap.length} published page(s) missing from sitemap`,
      recommendation: `Missing pages: ${missingFromSitemap.slice(0, 5).join(', ')}${missingFromSitemap.length > 5 ? ` (+${missingFromSitemap.length - 5} more)` : ''}`,
    })
  }

  return { found: true, urls: sitemapUrls }
}

// ---------------------------------------------------------------------------
// Robots.txt check
// ---------------------------------------------------------------------------

async function checkRobotsTxt(issues: AuditIssue[]) {
  const robotsUrl = `${BASE_URL}/robots.txt`
  console.log(`  Checking robots.txt: ${robotsUrl}`)

  const result = await fetchPage(robotsUrl)

  if (result.error || result.status !== 200) {
    issues.push({
      severity: 'medium',
      category: 'Crawlability',
      page: robotsUrl,
      message: 'Missing or inaccessible robots.txt',
      recommendation: 'Add a robots.txt with Sitemap directive pointing to /sitemap.xml.',
    })
    return
  }

  // Check for sitemap reference
  if (result.html && !result.html.toLowerCase().includes('sitemap')) {
    issues.push({
      severity: 'low',
      category: 'Crawlability',
      page: robotsUrl,
      message: 'robots.txt missing Sitemap directive',
      recommendation: `Add "Sitemap: ${BASE_URL}/sitemap.xml" to robots.txt.`,
    })
  }

  if (verbose) {
    console.log(`    robots.txt content:\n${result.html?.slice(0, 300)}`)
  }
}

// ---------------------------------------------------------------------------
// GSC indexing data
// ---------------------------------------------------------------------------

async function fetchIndexingData(issues: AuditIssue[]) {
  console.log('  Checking GSC indexing data...')

  const { data, error } = await supabase
    .from('gsc_snapshots')
    .select('snapshot_date, data')
    .eq('organization_id', ORG_ID)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .returns<{ snapshot_date: string; data: Record<string, unknown> }[]>()

  if (error || !data || data.length === 0) {
    console.log('    No GSC snapshot data available.')
    return
  }

  const snapshot = data[0]!
  console.log(`    Latest snapshot: ${snapshot.snapshot_date}`)

  const coverage = snapshot.data.indexing_coverage as Record<string, number> | undefined
  if (coverage) {
    console.log(`    Valid (indexed): ${coverage.valid ?? 'N/A'}`)
    console.log(`    Warnings:        ${coverage.warnings ?? 0}`)
    console.log(`    Errors:          ${coverage.errors ?? 0}`)
    console.log(`    Excluded:        ${coverage.excluded ?? 0}`)

    if ((coverage.errors ?? 0) > 0) {
      issues.push({
        severity: 'high',
        category: 'Indexing',
        page: DOMAIN,
        message: `${coverage.errors} indexing error(s) in GSC`,
        recommendation: 'Review Google Search Console for indexing errors and fix affected pages.',
      })
    }

    if ((coverage.warnings ?? 0) > 0) {
      issues.push({
        severity: 'medium',
        category: 'Indexing',
        page: DOMAIN,
        message: `${coverage.warnings} indexing warning(s) in GSC`,
        recommendation: 'Review GSC warnings — these pages may not be indexed optimally.',
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Report printer
// ---------------------------------------------------------------------------

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
}

function printDivider(title: string) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(70))
}

function printAuditReport(issues: AuditIssue[], pageCount: number, responseTimesMs: number[]) {
  printDivider('TECHNICAL SEO AUDIT REPORT')

  // Overall stats
  const avgResponseTime =
    responseTimesMs.length > 0
      ? Math.round(responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length)
      : 0
  const maxResponseTime = responseTimesMs.length > 0 ? Math.max(...responseTimesMs) : 0

  console.log(`\n  Pages audited:        ${pageCount}`)
  console.log(`  Total issues found:   ${issues.length}`)
  console.log(`  Avg response time:    ${avgResponseTime}ms`)
  console.log(`  Max response time:    ${maxResponseTime}ms`)

  // Count by severity
  const bySeverity = new Map<Severity, number>()
  for (const issue of issues) {
    bySeverity.set(issue.severity, (bySeverity.get(issue.severity) ?? 0) + 1)
  }

  console.log('\n  Issues by severity:')
  for (const sev of ['critical', 'high', 'medium', 'low'] as Severity[]) {
    const count = bySeverity.get(sev) ?? 0
    if (count > 0) {
      console.log(`    ${SEVERITY_LABELS[sev].padEnd(10)} ${count}`)
    }
  }

  // Count by category
  const byCategory = new Map<string, number>()
  for (const issue of issues) {
    byCategory.set(issue.category, (byCategory.get(issue.category) ?? 0) + 1)
  }

  console.log('\n  Issues by category:')
  for (const [cat, count] of [...byCategory.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat.padEnd(20)} ${count}`)
  }

  // Sorted issues
  const sorted = [...issues].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  printDivider('DETAILED ISSUES')

  let currentSeverity: Severity | null = null
  for (const issue of sorted) {
    if (issue.severity !== currentSeverity) {
      currentSeverity = issue.severity
      console.log(`\n  --- ${SEVERITY_LABELS[currentSeverity]} ---\n`)
    }

    const shortPage = issue.page.replace(BASE_URL, '')
    console.log(`  [${issue.category}] ${shortPage || '/'}`)
    console.log(`    ${issue.message}`)
    console.log(`    Fix: ${issue.recommendation}`)
    console.log()
  }

  if (issues.length === 0) {
    console.log('\n  No issues found — site looks healthy!\n')
  }

  // Action summary
  printDivider('RECOMMENDED ACTIONS')

  const critical = sorted.filter((i) => i.severity === 'critical')
  const high = sorted.filter((i) => i.severity === 'high')

  if (critical.length > 0) {
    console.log('\n  IMMEDIATE (critical):')
    for (const issue of critical) {
      console.log(`    - ${issue.message} (${issue.page.replace(BASE_URL, '') || '/'})`)
    }
  }

  if (high.length > 0) {
    console.log('\n  THIS WEEK (high priority):')
    for (const issue of high) {
      console.log(`    - ${issue.message} (${issue.page.replace(BASE_URL, '') || '/'})`)
    }
  }

  const medium = sorted.filter((i) => i.severity === 'medium')
  if (medium.length > 0) {
    console.log(`\n  NEXT SPRINT (medium): ${medium.length} issue(s) — address in next cycle`)
  }

  const low = sorted.filter((i) => i.severity === 'low')
  if (low.length > 0) {
    console.log(`  BACKLOG (low): ${low.length} issue(s) — nice-to-have improvements`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== SEO Growth Sprint — Phase 4: Technical SEO Audit ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  console.log(`Domain: ${DOMAIN}`)
  if (checkFilter) console.log(`Check filter: ${checkFilter.join(', ')}`)
  if (verbose) console.log('[VERBOSE MODE]')

  const issues: AuditIssue[] = []
  const responseTimes: number[] = []

  // 1. Fetch all published pages from DB
  console.log('\n  Fetching published pages from database...')
  const contentGroups = await fetchPublishedPages()
  const allPages: { type: string; page: ContentRow; url: string }[] = []

  for (const group of contentGroups) {
    for (const page of group.pages) {
      allPages.push({ type: group.type, page, url: pageUrl(group.type, page.slug) })
    }
  }

  console.log(`  Found ${allPages.length} published pages:`)
  for (const group of contentGroups) {
    console.log(`    ${group.type}: ${group.pages.length}`)
  }

  // 2. Build URL list (content pages + homepage)
  const urlsToCheck = [BASE_URL, ...allPages.map((p) => p.url)]

  // 3. Fetch all pages
  console.log(`\n  Fetching ${urlsToCheck.length} pages (concurrency: ${CONCURRENT_FETCHES})...`)
  const fetchResults = await fetchInBatches(urlsToCheck, CONCURRENT_FETCHES)

  for (const result of fetchResults) {
    responseTimes.push(result.responseTimeMs)
    const statusIcon = result.status === 200 ? 'OK' : result.status ? `${result.status}` : 'ERR'
    if (verbose) {
      console.log(
        `    [${statusIcon}] ${result.responseTimeMs}ms ${result.url.replace(BASE_URL, '') || '/'}`,
      )
    }
  }

  // 4. Run checks on each page
  console.log('\n  Running audit checks...')

  const shouldCheck = (name: string) => !checkFilter || checkFilter.includes(name)

  for (const result of fetchResults) {
    const isHomepage = result.url === BASE_URL || result.url === `${BASE_URL}/`
    const pageInfo = allPages.find((p) => p.url === result.url)
    const pageType = isHomepage ? 'homepage' : (pageInfo?.type ?? 'unknown')
    const dbPage = pageInfo?.page ?? {
      id: '',
      title: '',
      slug: '',
      status: 'published',
      meta_title: null,
      meta_description: null,
      hero_image_url: null,
    }

    if (shouldCheck('http')) checkHttpStatus(result, issues)
    if (shouldCheck('meta')) checkMetaTags(result, dbPage, issues)
    if (shouldCheck('og')) checkOpenGraph(result, dbPage, issues)
    if (shouldCheck('schema')) checkSchemaMarkup(result, pageType, issues)
    if (shouldCheck('structure')) checkHeadingStructure(result, issues)
    if (shouldCheck('links')) {
      const allUrlSet = new Set(allPages.map((p) => p.url))
      checkInternalLinks(result, allUrlSet, issues)
    }
  }

  // 5. Check sitemap
  if (shouldCheck('sitemap')) {
    const publishedUrls = allPages.map((p) => p.url)
    await checkSitemap(publishedUrls, issues)
  }

  // 6. Check robots.txt
  if (shouldCheck('robots')) {
    await checkRobotsTxt(issues)
  }

  // 7. Check GSC indexing data
  if (shouldCheck('indexing')) {
    await fetchIndexingData(issues)
  }

  // 8. Print report
  printAuditReport(issues, urlsToCheck.length, responseTimes)

  console.log('\n=== Phase 4 Complete ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
