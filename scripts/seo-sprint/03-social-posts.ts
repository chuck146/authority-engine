/**
 * SEO Growth Sprint — Phase 3: Social Post Distribution
 *
 * Generates 12 social posts (6 GBP + 3 Instagram + 3 Facebook) based on
 * top-performing published pages. Each post links back to a published page.
 * All posts enter "review" status. Calendar entries spread across 14 days.
 *
 * Usage:
 *   npx tsx scripts/seo-sprint/03-social-posts.ts
 *   npx tsx scripts/seo-sprint/03-social-posts.ts --dry-run
 *   npx tsx scripts/seo-sprint/03-social-posts.ts --platform=gbp
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
const SERVICE_AREA = 'Union, Essex, Morris, and Somerset counties, NJ'
const GENERATION_DELAY_MS = 2000

// Post distribution: 6 GBP, 3 Instagram, 3 Facebook
const POST_PLAN: { platform: 'gbp' | 'instagram' | 'facebook'; count: number }[] = [
  { platform: 'gbp', count: 6 },
  { platform: 'instagram', count: 3 },
  { platform: 'facebook', count: 3 },
]

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
const filterPlatform = flagMap.get('platform') as 'gbp' | 'instagram' | 'facebook' | undefined

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
    max_tokens: 1024,
    temperature: 0.8,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('Claude returned no text')
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
  content_type: string
}

type SocialPostContent = {
  body: string
  hashtags: string[]
  cta_type?: string
  cta_url?: string
  image_prompt?: string
}

// ---------------------------------------------------------------------------
// Fetch top published pages (for post topics)
// ---------------------------------------------------------------------------

async function fetchTopPages(): Promise<ContentRow[]> {
  const pages: ContentRow[] = []

  // Fetch published pages from all content tables
  const [services, locations, blogs] = await Promise.all([
    supabase
      .from('service_pages')
      .select('id, title, slug, status')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('seo_score', { ascending: false })
      .limit(8)
      .returns<{ id: string; title: string; slug: string; status: string }[]>(),
    supabase
      .from('location_pages')
      .select('id, title, slug, status')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('seo_score', { ascending: false })
      .limit(8)
      .returns<{ id: string; title: string; slug: string; status: string }[]>(),
    supabase
      .from('blog_posts')
      .select('id, title, slug, status')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('seo_score', { ascending: false })
      .limit(5)
      .returns<{ id: string; title: string; slug: string; status: string }[]>(),
  ])

  for (const page of services.data ?? []) {
    pages.push({ ...page, content_type: 'service_page' })
  }
  for (const page of locations.data ?? []) {
    pages.push({ ...page, content_type: 'location_page' })
  }
  for (const page of blogs.data ?? []) {
    pages.push({ ...page, content_type: 'blog_post' })
  }

  return pages
}

function pageUrl(page: ContentRow): string {
  const prefix =
    page.content_type === 'service_page'
      ? 'services'
      : page.content_type === 'location_page'
        ? 'locations'
        : 'blog'
  return `https://${DOMAIN}/${prefix}/${page.slug}`
}

// ---------------------------------------------------------------------------
// Social post generation prompts
// ---------------------------------------------------------------------------

const SOCIAL_JSON_FORMAT = `
Respond ONLY with a valid JSON object (no markdown, no code fences):
{
  "body": "string — the post text",
  "hashtags": ["string"],
  "cta_type": "string or null",
  "cta_url": "string or null",
  "image_prompt": "string or null — describe an image that would complement this post"
}`

function buildGbpPrompt(page: ContentRow, springAngle: string): { system: string; user: string } {
  return {
    system: `You are an expert local business marketer writing Google Business Profile posts for ${ORG_NAME} — "${TAGLINE}". GBP posts appear in Google Search and Maps results.

Tone: professional
Service Area: ${SERVICE_AREA}

Guidelines:
- Maximum 1500 characters for the body
- Focus on local relevance and service expertise
- Spring 2026 theme: ${springAngle}
- Include clear call-to-action
- Do NOT use hashtags — return empty array
- 2-4 short paragraphs maximum
- Link to: ${pageUrl(page)}`,
    user: `Write a GBP post promoting "${page.title}" with a spring angle.

Page URL: ${pageUrl(page)}
${SOCIAL_JSON_FORMAT}`,
  }
}

function buildInstagramPrompt(
  page: ContentRow,
  springAngle: string,
): { system: string; user: string } {
  return {
    system: `You are a social media specialist writing Instagram posts for ${ORG_NAME} — "${TAGLINE}". You write engaging, visual-first captions.

Tone: friendly, inspiring
Service Area: ${SERVICE_AREA}

Guidelines:
- Engaging caption with line breaks for readability
- Spring 2026 theme: ${springAngle}
- Include 10-15 relevant hashtags (mix of branded, service, local, seasonal)
- Include emoji sparingly (2-3 max in body)
- Reference the page topic naturally
- Include CTA to link in bio`,
    user: `Write an Instagram caption promoting "${page.title}" with a spring angle.

Link: ${pageUrl(page)}
${SOCIAL_JSON_FORMAT}`,
  }
}

function buildFacebookPrompt(
  page: ContentRow,
  springAngle: string,
): { system: string; user: string } {
  return {
    system: `You are a social media manager writing Facebook posts for ${ORG_NAME} — "${TAGLINE}". Facebook posts should be conversational and community-focused.

Tone: friendly, helpful
Service Area: ${SERVICE_AREA}

Guidelines:
- Community-focused, conversational tone
- Spring 2026 theme: ${springAngle}
- Ask a question to boost engagement
- 3-5 relevant hashtags
- Include the page link directly in the body
- 1-3 paragraphs`,
    user: `Write a Facebook post promoting "${page.title}" with a spring angle.

Link: ${pageUrl(page)}
${SOCIAL_JSON_FORMAT}`,
  }
}

// ---------------------------------------------------------------------------
// Spring angles for variety
// ---------------------------------------------------------------------------

const SPRING_ANGLES = [
  'Spring is the perfect time to refresh your home with a new paint job',
  'Get ahead of summer — prepare your home exterior this spring',
  'Spring cleaning meets fresh paint for a complete home renewal',
  'Boost your curb appeal this spring before the neighborhood comes alive',
  "NJ spring weather is ideal for exterior painting — don't miss the window",
  'Transform your space before summer entertaining season',
  'Spring home improvement that adds real value to your property',
  'Fresh colors for a fresh season — spring painting inspiration',
  'Beat the summer rush — schedule your painting project now',
  'Spring is here — time to give your home the attention it deserves',
  'Make your home the envy of the block this spring',
  'Professional painting tips for the spring homeowner',
]

// ---------------------------------------------------------------------------
// Generate and save posts
// ---------------------------------------------------------------------------

async function generateAndSavePosts(
  pages: ContentRow[],
): Promise<{ platform: string; topic: string; scheduled: string }[]> {
  const created: { platform: string; topic: string; scheduled: string }[] = []
  let angleIdx = 0

  // Calculate schedule dates (spread across 14 days starting tomorrow)
  const scheduleStart = new Date()
  scheduleStart.setDate(scheduleStart.getDate() + 1)
  scheduleStart.setHours(10, 0, 0, 0) // 10 AM

  let dayOffset = 0

  for (const { platform, count } of POST_PLAN) {
    if (filterPlatform && filterPlatform !== platform) continue

    console.log(`\n--- Generating ${count} ${platform.toUpperCase()} posts ---\n`)

    for (let i = 0; i < count; i++) {
      // Pick a page to promote (cycle through available pages)
      const page = pages[i % pages.length]!
      const angle = SPRING_ANGLES[angleIdx % SPRING_ANGLES.length]!
      angleIdx++

      // Build prompt based on platform
      let prompt: { system: string; user: string }
      switch (platform) {
        case 'gbp':
          prompt = buildGbpPrompt(page, angle)
          break
        case 'instagram':
          prompt = buildInstagramPrompt(page, angle)
          break
        case 'facebook':
          prompt = buildFacebookPrompt(page, angle)
          break
      }

      // Calculate scheduled date
      const scheduledAt = new Date(scheduleStart)
      scheduledAt.setDate(scheduledAt.getDate() + dayOffset)
      dayOffset = (dayOffset + 1) % 14 // Spread across 14 days
      const scheduledStr = scheduledAt.toISOString()

      console.log(
        `  [${i + 1}/${count}] ${platform.toUpperCase()}: "${page.title}" → ${scheduledAt.toISOString().slice(0, 10)}`,
      )

      if (dryRun) {
        console.log('    [dry run — skipped]')
        created.push({ platform, topic: page.title, scheduled: scheduledStr.slice(0, 10) })
        continue
      }

      try {
        const raw = await callClaude(prompt.system, prompt.user)
        const content = parseJsonResponse(raw) as SocialPostContent

        // Insert social post
        const { data: post, error: postErr } = await supabase
          .from('social_posts')
          .insert({
            organization_id: ORG_ID,
            platform,
            post_type: platform === 'gbp' ? 'update' : 'post',
            title: `Spring: ${page.title}`,
            body: content.body,
            hashtags: content.hashtags ?? [],
            cta_type: content.cta_type ?? null,
            cta_url: content.cta_url ?? pageUrl(page),
            status: 'review',
          } as never)
          .select('id')
          .single()

        if (postErr) throw new Error(`Social post insert failed: ${postErr.message}`)

        // Insert calendar entry
        const { error: calErr } = await supabase.from('content_calendar').insert({
          organization_id: ORG_ID,
          content_type: 'social_post',
          content_id: post!.id,
          title: `${platform.toUpperCase()}: ${page.title}`,
          scheduled_at: scheduledStr,
          status: 'scheduled',
        } as never)

        if (calErr) {
          console.log(`    ⚠ Calendar entry failed: ${calErr.message}`)
        }

        created.push({ platform, topic: page.title, scheduled: scheduledStr.slice(0, 10) })
        console.log(`    ✓ Created (status: review, scheduled: ${scheduledStr.slice(0, 10)})`)
      } catch (err) {
        console.error(`    ✗ Error: ${(err as Error).message}`)
      }

      await sleep(GENERATION_DELAY_MS)
    }
  }

  return created
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== SEO Growth Sprint — Phase 3: Social Post Distribution ===')
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)
  if (filterPlatform) console.log(`Platform filter: ${filterPlatform}`)
  if (dryRun) console.log('[DRY RUN — no posts will be created]')

  // Fetch top published pages to use as post topics
  const pages = await fetchTopPages()
  console.log(`\nFound ${pages.length} published pages to promote:`)
  for (const page of pages.slice(0, 10)) {
    console.log(`  - ${page.title} (${page.content_type}) → ${pageUrl(page)}`)
  }

  if (pages.length === 0) {
    console.log('\nNo published pages found. Run Phase 1 first.')
    return
  }

  // Generate posts
  const created = await generateAndSavePosts(pages)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('  Phase 3 Summary')
  console.log('='.repeat(60))

  const byPlatform = new Map<string, number>()
  for (const post of created) {
    byPlatform.set(post.platform, (byPlatform.get(post.platform) ?? 0) + 1)
  }

  console.log(`\n  Total posts created: ${created.length}`)
  for (const [platform, count] of byPlatform) {
    console.log(`    ${platform.toUpperCase()}: ${count}`)
  }

  if (created.length > 0) {
    console.log('\n  Schedule:')
    console.log('    ' + 'Date'.padEnd(14) + 'Platform'.padEnd(12) + 'Topic')
    console.log('    ' + '-'.repeat(60))
    for (const post of created.sort((a, b) => a.scheduled.localeCompare(b.scheduled))) {
      console.log(
        '    ' +
          post.scheduled.padEnd(14) +
          post.platform.toUpperCase().padEnd(12) +
          post.topic.slice(0, 40),
      )
    }
  }

  console.log(
    '\n  All posts created with status "review" — approve in dashboard before publishing.',
  )
  console.log('\n=== Phase 3 Complete ===\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
