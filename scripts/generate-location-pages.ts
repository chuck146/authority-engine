/**
 * Bulk Location Page Generation Script
 *
 * Generates SEO-optimized location pages for NJ towns using Claude API,
 * then inserts them into the database with status "review".
 *
 * Usage:
 *   npx tsx scripts/generate-location-pages.ts --county=Middlesex
 *   npx tsx scripts/generate-location-pages.ts --town=Woodbridge
 *   npx tsx scripts/generate-location-pages.ts --dry-run
 *   npx tsx scripts/generate-location-pages.ts --limit=5
 *   npx tsx scripts/generate-location-pages.ts --force
 *   npx tsx scripts/generate-location-pages.ts --list
 *
 * Requires .env.local with:
 *   ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NJ_SERVICE_COUNTIES, type NjTown, type NjCounty } from '../lib/data/nj-towns'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const ORG_NAME = 'Cleanest Painting LLC'
const SERVICE_NAME = 'Painting Services'
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

const filterCounty = flagMap.get('county')
const filterTown = flagMap.get('town')
const dryRun = flagMap.has('dry-run')
const force = flagMap.has('force')
const limit = flagMap.has('limit') ? parseInt(flagMap.get('limit')!, 10) : undefined
const listOnly = flagMap.has('list')
const serviceName = flagMap.get('service') ?? SERVICE_NAME

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

function generateSlug(city: string): string {
  const base = `${serviceName} in ${city} NJ`
  return base
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateTitle(city: string): string {
  return `${serviceName} in ${city}, NJ`
}

function buildPrompt(
  city: string,
  county: string,
  nearbyTowns: string[],
): {
  system: string
  user: string
} {
  const nearbyContext =
    nearbyTowns.length > 0
      ? `\n- Nearby towns the company also serves: ${nearbyTowns.join(', ')}. You may reference 1-2 of these naturally.`
      : ''

  return {
    system: `You are an expert local SEO copywriter specializing in home improvement and painting contractor websites. You write location-specific service pages that rank for "[service] in [city]" searches and convert local visitors into leads.

Tone: professional

Brand: ${ORG_NAME} — a premium painting company known for craftsmanship and attention to detail.

Guidelines:
- Write specifically for homeowners in ${city}, NJ
- Reference local landmarks, neighborhoods, or character where relevant (but do not fabricate specific details you are unsure about)
- This town is in ${county} County, NJ. Mention the county naturally 1-2 times to capture county-level search queries.${nearbyContext}
- Include the city name naturally throughout the content (3-5 times)
- Sections should cover: local service overview, why homeowners in this area need this service, the company's presence in the area, and a local call to action
- Generate 4-5 sections
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body text
- meta_title format: "${serviceName} in ${city}, NJ | ${ORG_NAME}"
- meta_description should mention the city and include a call to action`,
    user: `Generate an SEO-optimized location page for: "${serviceName}" in ${city}, NJ

Identify and naturally incorporate 3-5 relevant local SEO keywords for "${serviceName}" in ${city}, NJ.

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

function getNearbyTowns(county: NjCounty, currentTown: string, count = 4): string[] {
  return county.towns
    .filter((t) => t.name !== currentTown)
    .slice(0, count)
    .map((t) => t.name)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Build the list of towns to generate
  let townsToGenerate: { town: NjTown; county: NjCounty }[] = []

  for (const county of NJ_SERVICE_COUNTIES) {
    if (filterCounty && county.name.toLowerCase() !== filterCounty.toLowerCase()) continue

    for (const t of county.towns) {
      if (filterTown && t.name.toLowerCase() !== filterTown.toLowerCase()) continue
      townsToGenerate.push({ town: t, county })
    }
  }

  if (limit && townsToGenerate.length > limit) {
    townsToGenerate = townsToGenerate.slice(0, limit)
  }

  // List mode — just show what would be generated
  if (listOnly) {
    console.log(`\n${townsToGenerate.length} towns matching filters:\n`)
    for (const { town, county } of townsToGenerate) {
      console.log(`  ${town.name}, NJ (${county.name} County) → ${generateSlug(town.name)}`)
    }
    return
  }

  console.log('=== Location Page Generator ===')
  console.log(`  Service: ${serviceName}`)
  if (filterCounty) console.log(`  County filter: ${filterCounty}`)
  if (filterTown) console.log(`  Town filter: ${filterTown}`)
  if (limit) console.log(`  Limit: ${limit}`)
  if (dryRun) console.log('  [DRY RUN — no pages will be created]')
  if (force) console.log('  [FORCE — will regenerate existing pages]')
  console.log(`  Towns to process: ${townsToGenerate.length}`)
  console.log()

  // Fetch existing slugs to skip duplicates
  const { data: existingPages } = await supabase
    .from('location_pages')
    .select('slug')
    .eq('organization_id', ORG_ID)

  const existingSlugs = new Set((existingPages ?? []).map((p: { slug: string }) => p.slug))

  let generated = 0
  let skipped = 0
  let errors = 0

  for (const { town, county } of townsToGenerate) {
    const slug = generateSlug(town.name)
    const title = generateTitle(town.name)

    if (!force && existingSlugs.has(slug)) {
      console.log(`  SKIP ${town.name} (${slug} already exists)`)
      skipped++
      continue
    }

    console.log(`  Generating: ${title}...`)

    if (dryRun) {
      console.log(`    [dry run — would create slug: ${slug}]`)
      continue
    }

    try {
      const nearbyTowns = getNearbyTowns(county, town.name)
      const prompt = buildPrompt(town.name, county.name, nearbyTowns)

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        temperature: 0.7,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      })

      const textBlock = response.content.find((b) => b.type === 'text')
      if (!textBlock || textBlock.type !== 'text') {
        throw new Error('Claude returned no text content')
      }

      const content = parseJsonResponse(textBlock.text)

      // Insert into database
      const { error: insertErr } = await supabase.from('location_pages').insert({
        organization_id: ORG_ID,
        title,
        slug,
        city: town.name,
        state: 'NJ',
        county: county.name,
        meta_title: (content as Record<string, string>).meta_title ?? null,
        meta_description: (content as Record<string, string>).meta_description ?? null,
        content,
        status: 'review',
        keywords: [
          `${serviceName.toLowerCase()} ${town.name} NJ`,
          `painters ${town.name} NJ`,
          `house painting ${town.name}`,
        ],
      } as never)

      if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`)

      existingSlugs.add(slug)
      generated++
      console.log(`    ✓ Created (status: review)`)
    } catch (err) {
      console.error(`    ✗ Error: ${(err as Error).message}`)
      errors++
    }

    // Rate limit between API calls
    await sleep(GENERATION_DELAY_MS)
  }

  console.log(`\n=== Done ===`)
  console.log(`  Generated: ${generated}`)
  console.log(`  Skipped:   ${skipped}`)
  console.log(`  Errors:    ${errors}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
