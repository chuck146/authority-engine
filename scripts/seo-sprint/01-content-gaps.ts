/**
 * SEO Growth Sprint — Phase 1: Publish Review Pages + Content Gap Generation
 *
 * Step 1A: Publish pages stuck in "review" status (if SEO score >= 80)
 * Step 1B: Generate spring-themed blog posts for striking-distance keywords
 * Step 1C: Generate location pages for high-opportunity expansion cities
 *
 * Usage:
 *   npx tsx scripts/seo-sprint/01-content-gaps.ts
 *   npx tsx scripts/seo-sprint/01-content-gaps.ts --dry-run
 *   npx tsx scripts/seo-sprint/01-content-gaps.ts --publish-only
 *   npx tsx scripts/seo-sprint/01-content-gaps.ts --blogs-only
 *   npx tsx scripts/seo-sprint/01-content-gaps.ts --locations-only
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
const DOMAIN = 'cleanestpaintingnj.com'
const TAGLINE = 'Where Artistry Meets Craftsmanship'
const SERVICE_AREA = 'Union, Essex, Morris, and Somerset counties in New Jersey'
const GENERATION_DELAY_MS = 3000
const PUBLISH_THRESHOLD = 80 // SEO score minimum to auto-publish review pages
const MAX_BLOG_POSTS = 5
const MAX_LOCATION_PAGES = 5

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
const publishOnly = flagMap.has('publish-only')
const blogsOnly = flagMap.has('blogs-only')
const locationsOnly = flagMap.has('locations-only')

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

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
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
    temperature: 0.7,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content')
  }
  return textBlock.text
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
  content: Record<string, unknown> | null
}

type StructuredContent = {
  headline: string
  intro: string
  sections: { title: string; body: string }[]
  cta: string
  meta_title: string
  meta_description: string
}

type KeywordRow = {
  query: string
  clicks: number
  impressions: number
  position: number
}

// ---------------------------------------------------------------------------
// Step 1A: Publish review pages
// ---------------------------------------------------------------------------

async function publishReviewPages(): Promise<{ published: string[]; skipped: string[] }> {
  console.log('\n--- Step 1A: Publish pages stuck in review ---\n')

  const published: string[] = []
  const skipped: string[] = []

  const tables = ['service_pages', 'location_pages', 'blog_posts'] as const

  for (const table of tables) {
    const { data: reviewPages, error } = await supabase
      .from(table)
      .select('id, title, slug, status, seo_score')
      .eq('organization_id', ORG_ID)
      .eq('status', 'review' as never)
      .returns<ContentRow[]>()

    if (error) {
      console.error(`  Error fetching ${table}: ${error.message}`)
      continue
    }

    for (const page of reviewPages ?? []) {
      const score = page.seo_score ?? 0

      if (score >= PUBLISH_THRESHOLD) {
        console.log(`  ✓ Publishing: ${page.title} (SEO: ${score}, table: ${table})`)

        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from(table)
            .update({ status: 'published', published_at: new Date().toISOString() } as never)
            .eq('id', page.id)

          if (updateErr) {
            console.error(`    Error updating: ${updateErr.message}`)
            skipped.push(page.title)
            continue
          }
        }
        published.push(page.title)
      } else {
        console.log(
          `  ⏭ Skipping: ${page.title} (SEO: ${score} < ${PUBLISH_THRESHOLD}, needs optimization in Phase 2)`,
        )
        skipped.push(page.title)
      }
    }
  }

  console.log(`\n  Published: ${published.length}, Skipped: ${skipped.length}`)
  return { published, skipped }
}

// ---------------------------------------------------------------------------
// Step 1B: Generate spring-themed blog posts
// ---------------------------------------------------------------------------

const SPRING_BLOG_TOPICS = [
  {
    topic: 'Best Time to Paint Your Home Exterior in New Jersey',
    keywords: ['best time to paint exterior', 'exterior painting NJ', 'spring painting'],
    category: 'seasonal-tips',
  },
  {
    topic: 'Spring Home Refresh: Interior Paint Colors for 2026',
    keywords: ['spring interior paint colors', 'paint color trends 2026', 'home refresh'],
    category: 'painting-tips',
  },
  {
    topic: 'Deck Staining Guide: Prep Your Deck for Spring and Summer',
    keywords: ['deck staining', 'deck prep spring', 'deck maintenance NJ'],
    category: 'guides',
  },
  {
    topic: 'Boost Your Curb Appeal: Spring Exterior Painting Tips',
    keywords: ['curb appeal painting', 'exterior painting tips', 'home value painting'],
    category: 'project-ideas',
  },
  {
    topic: 'Spring Cleaning Meets Fresh Paint: Complete Home Renewal Guide',
    keywords: ['spring cleaning painting', 'home renewal', 'interior painting spring'],
    category: 'seasonal-tips',
  },
]

function buildBlogPrompt(topic: string, keywords: string[]): { system: string; user: string } {
  return {
    system: `You are an expert SEO copywriter specializing in home improvement and painting contractor content. You write engaging, informative blog posts that rank well for target keywords while providing genuine value to homeowners.

Tone: friendly, knowledgeable, helpful
Brand: ${ORG_NAME} — "${TAGLINE}"
Website: ${DOMAIN}
Service Area: ${SERVICE_AREA}

Guidelines:
- Write for NJ homeowners planning spring/early spring painting projects
- Include practical, actionable advice
- Reference NJ-specific weather considerations (spring rain, humidity, pollen season)
- Naturally incorporate target keywords 3-5 times throughout
- Generate 4-5 substantial sections (each section 80-150 words)
- Total content should be 800-1200 words
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body text
- meta_title: max 60 chars, include primary keyword
- meta_description: 120-160 chars, include CTA`,
    user: `Generate an SEO-optimized blog post about: "${topic}"

Target keywords: ${keywords.join(', ')}

This is a SPRING 2026 seasonal post — make it timely and relevant to the current season.

IMPORTANT: Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "headline": "string — the main H1 heading",
  "intro": "string — 2-3 sentence intro paragraph with HTML tags",
  "sections": [
    { "title": "string — section heading", "body": "string — section body with HTML tags" }
  ],
  "cta": "string — call to action text",
  "meta_title": "string — max 60 chars",
  "meta_description": "string — max 160 chars"
}`,
  }
}

async function generateBlogPosts(): Promise<string[]> {
  console.log('\n--- Step 1B: Generate spring-themed blog posts ---\n')

  // Check for existing blog slugs to avoid duplicates
  const { data: existingBlogs } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('organization_id', ORG_ID)

  const existingSlugs = new Set((existingBlogs ?? []).map((b: { slug: string }) => b.slug))

  // Check for striking-distance keywords to prioritize
  const twentyEightDaysAgo = new Date()
  twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28)

  const { data: keywordRows } = await supabase
    .from('keyword_rankings')
    .select('query, clicks, impressions, position')
    .eq('organization_id', ORG_ID)
    .gte('date', twentyEightDaysAgo.toISOString().slice(0, 10))
    .returns<KeywordRow[]>()

  // Find striking-distance keywords (positions 11-30)
  const strikingKeywords = new Map<string, { avgPos: number; impressions: number }>()
  if (keywordRows) {
    const kwMap = new Map<string, { posSum: number; imprSum: number; count: number }>()
    for (const row of keywordRows) {
      const existing = kwMap.get(row.query)
      if (existing) {
        existing.posSum += row.position
        existing.imprSum += row.impressions
        existing.count += 1
      } else {
        kwMap.set(row.query, { posSum: row.position, imprSum: row.impressions, count: 1 })
      }
    }
    for (const [query, d] of kwMap) {
      const avgPos = d.posSum / d.count
      if (avgPos >= 11 && avgPos <= 30) {
        strikingKeywords.set(query, { avgPos, impressions: d.imprSum })
      }
    }
  }

  if (strikingKeywords.size > 0) {
    console.log(`  Found ${strikingKeywords.size} striking-distance keywords:`)
    const sorted = [...strikingKeywords.entries()].sort((a, b) => a[1].avgPos - b[1].avgPos)
    for (const [query, data] of sorted.slice(0, 10)) {
      console.log(
        `    "${query}" — avg position ${data.avgPos.toFixed(1)}, ${data.impressions} impressions`,
      )
    }
  } else {
    console.log('  No striking-distance keywords found — using predefined spring topics')
  }

  const createdSlugs: string[] = []
  const topics = SPRING_BLOG_TOPICS.slice(0, MAX_BLOG_POSTS)

  for (const { topic, keywords, category } of topics) {
    const slug = generateSlug(topic)

    if (existingSlugs.has(slug)) {
      console.log(`  SKIP "${topic}" (slug ${slug} already exists)`)
      continue
    }

    console.log(`  Generating: "${topic}"...`)

    if (dryRun) {
      console.log(`    [dry run — would create slug: ${slug}]`)
      createdSlugs.push(slug)
      continue
    }

    try {
      const prompt = buildBlogPrompt(topic, keywords)
      const raw = await callClaude(prompt.system, prompt.user)
      const content = parseJsonResponse(raw) as StructuredContent

      // Calculate word count and reading time
      const wordCount = [content.intro, ...content.sections.map((s) => s.body), content.cta]
        .join(' ')
        .replace(/<[^>]*>/g, '')
        .split(/\s+/).length
      const readingTime = Math.max(1, Math.ceil(wordCount / 200))

      const { error: insertErr } = await supabase.from('blog_posts').insert({
        organization_id: ORG_ID,
        title: content.headline,
        slug,
        excerpt: content.intro.replace(/<[^>]*>/g, '').slice(0, 200),
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        content: content as unknown as Record<string, unknown>,
        status: 'review',
        keywords,
        category,
        reading_time_minutes: readingTime,
        seo_score: null, // Will be calculated in Phase 2
      } as never)

      if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`)

      existingSlugs.add(slug)
      createdSlugs.push(slug)
      console.log(`    ✓ Created (${wordCount} words, ~${readingTime} min read)`)
    } catch (err) {
      console.error(`    ✗ Error: ${(err as Error).message}`)
    }

    await sleep(GENERATION_DELAY_MS)
  }

  console.log(`\n  Blog posts created: ${createdSlugs.length}`)
  return createdSlugs
}

// ---------------------------------------------------------------------------
// Step 1C: Generate location pages for expansion cities
// ---------------------------------------------------------------------------

// Top opportunity expansion cities in the primary service area
const EXPANSION_CITIES = [
  { city: 'Berkeley Heights', county: 'Union', state: 'NJ' },
  { city: 'Millburn', county: 'Essex', state: 'NJ' },
  { city: 'Livingston', county: 'Essex', state: 'NJ' },
  { city: 'Springfield', county: 'Union', state: 'NJ' },
  { city: 'Mountainside', county: 'Union', state: 'NJ' },
]

function buildLocationPrompt(city: string, county: string): { system: string; user: string } {
  return {
    system: `You are an expert local SEO copywriter specializing in home improvement and painting contractor websites. You write location-specific service pages that rank for "[service] in [city]" searches.

Tone: professional
Brand: ${ORG_NAME} — "${TAGLINE}"
Website: ${DOMAIN}
Service Area: ${SERVICE_AREA}

Guidelines:
- Write specifically for homeowners in ${city}, NJ
- Reference local character where relevant (but do not fabricate)
- This town is in ${county} County, NJ. Mention the county 1-2 times.
- Include the city name naturally 3-5 times
- 4-5 sections covering: local overview, services, why choose us, local CTA
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body
- meta_title format: "Painting Services in ${city}, NJ | ${ORG_NAME}"
- meta_description: mention city + CTA, 120-160 chars`,
    user: `Generate an SEO-optimized location page for painting services in ${city}, NJ (${county} County).

Target keywords: painting services ${city} NJ, painters ${city} NJ, house painting ${city}

IMPORTANT: Respond ONLY with a valid JSON object (no markdown, no code fences) in this exact format:
{
  "headline": "string — the main H1 heading",
  "intro": "string — 2-3 sentence intro paragraph with HTML tags",
  "sections": [
    { "title": "string — section heading", "body": "string — section body with HTML tags" }
  ],
  "cta": "string — call to action text",
  "meta_title": "string — max 60 chars",
  "meta_description": "string — max 160 chars"
}`,
  }
}

async function generateLocationPages(): Promise<string[]> {
  console.log('\n--- Step 1C: Generate expansion location pages ---\n')

  // Check for existing location slugs
  const { data: existingLocations } = await supabase
    .from('location_pages')
    .select('slug, city')
    .eq('organization_id', ORG_ID)

  const existingSlugs = new Set((existingLocations ?? []).map((l: { slug: string }) => l.slug))
  const existingCities = new Set(
    (existingLocations ?? []).map((l: { city: string }) => l.city.toLowerCase()),
  )

  const createdSlugs: string[] = []
  const cities = EXPANSION_CITIES.slice(0, MAX_LOCATION_PAGES)

  for (const { city, county, state } of cities) {
    if (existingCities.has(city.toLowerCase())) {
      console.log(`  SKIP ${city} (already has a location page)`)
      continue
    }

    const slug = generateSlug(`painting-services-in-${city}-${state}`)
    if (existingSlugs.has(slug)) {
      console.log(`  SKIP ${city} (slug ${slug} already exists)`)
      continue
    }

    console.log(`  Generating: Painting Services in ${city}, ${state}...`)

    if (dryRun) {
      console.log(`    [dry run — would create slug: ${slug}]`)
      createdSlugs.push(slug)
      continue
    }

    try {
      const prompt = buildLocationPrompt(city, county)
      const raw = await callClaude(prompt.system, prompt.user)
      const content = parseJsonResponse(raw) as StructuredContent

      const title = `Painting Services in ${city}, ${state}`
      const keywords = [
        `painting services ${city} NJ`,
        `painters ${city} NJ`,
        `house painting ${city}`,
      ]

      const { error: insertErr } = await supabase.from('location_pages').insert({
        organization_id: ORG_ID,
        title,
        slug,
        city,
        state,
        county,
        meta_title: content.meta_title,
        meta_description: content.meta_description,
        content: content as unknown as Record<string, unknown>,
        status: 'review',
        keywords,
        seo_score: null, // Will be calculated in Phase 2
      } as never)

      if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`)

      existingSlugs.add(slug)
      createdSlugs.push(slug)
      console.log(`    ✓ Created (status: review)`)
    } catch (err) {
      console.error(`    ✗ Error: ${(err as Error).message}`)
    }

    await sleep(GENERATION_DELAY_MS)
  }

  console.log(`\n  Location pages created: ${createdSlugs.length}`)
  return createdSlugs
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== SEO Growth Sprint — Phase 1: Content Gaps ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  if (dryRun) console.log('[DRY RUN — no changes will be made]')

  const results = {
    publishedPages: [] as string[],
    skippedPages: [] as string[],
    newBlogSlugs: [] as string[],
    newLocationSlugs: [] as string[],
  }

  // Step 1A: Publish review pages
  if (!blogsOnly && !locationsOnly) {
    const { published, skipped } = await publishReviewPages()
    results.publishedPages = published
    results.skippedPages = skipped
  }

  // Step 1B: Generate blog posts
  if (!publishOnly && !locationsOnly) {
    results.newBlogSlugs = await generateBlogPosts()
  }

  // Step 1C: Generate location pages
  if (!publishOnly && !blogsOnly) {
    results.newLocationSlugs = await generateLocationPages()
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('  Phase 1 Summary')
  console.log('='.repeat(60))
  console.log(`  Pages published from review: ${results.publishedPages.length}`)
  if (results.publishedPages.length > 0) {
    for (const title of results.publishedPages) console.log(`    - ${title}`)
  }
  console.log(`  Pages skipped (need optimization): ${results.skippedPages.length}`)
  if (results.skippedPages.length > 0) {
    for (const title of results.skippedPages) console.log(`    - ${title}`)
  }
  console.log(`  New blog posts created: ${results.newBlogSlugs.length}`)
  if (results.newBlogSlugs.length > 0) {
    for (const slug of results.newBlogSlugs) console.log(`    - /blog/${slug}`)
  }
  console.log(`  New location pages created: ${results.newLocationSlugs.length}`)
  if (results.newLocationSlugs.length > 0) {
    for (const slug of results.newLocationSlugs) console.log(`    - /locations/${slug}`)
  }
  console.log(`\n  Next: Run Phase 2 (02-seo-optimize.ts) to score and optimize all content`)
  console.log(`  Then: Run generate-hero-images.ts for any new location pages`)
  console.log('\n=== Phase 1 Complete ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
