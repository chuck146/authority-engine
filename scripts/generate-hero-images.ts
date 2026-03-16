/**
 * Hero Image Generation Script
 *
 * Generates hero images for all service and location pages using Nano Banana 2
 * (Gemini Flash Image) and uploads them to Supabase Storage, then updates
 * the hero_image_url column on each page.
 *
 * Usage:
 *   npx tsx scripts/generate-hero-images.ts
 *   npx tsx scripts/generate-hero-images.ts --type=service
 *   npx tsx scripts/generate-hero-images.ts --type=location
 *   npx tsx scripts/generate-hero-images.ts --type=blog
 *   npx tsx scripts/generate-hero-images.ts --slug=interior-painting
 *   npx tsx scripts/generate-hero-images.ts --dry-run
 *
 * Requires .env with:
 *   GOOGLE_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const ORG_NAME = 'Cleanest Painting LLC'
const BRAND = { primary: '#1B2B5B', secondary: '#fbbf24', accent: '#1e3a5f' }
const TAGLINE = 'Where Artistry Meets Craftsmanship'
const BUCKET = 'media'

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}
const filterType = flagMap.get('type') as 'service' | 'location' | 'blog' | undefined
const filterSlug = flagMap.get('slug')
const dryRun = flagMap.has('dry-run')
const skipExisting = !flagMap.has('force')

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

async function generateImage(prompt: string): Promise<{ data: Buffer; mime: string }> {
  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: { responseModalities: ['IMAGE'] },
  })

  const imagePart = response.candidates?.[0]?.content?.parts?.find((p) =>
    p.inlineData?.mimeType?.startsWith('image/'),
  )

  if (!imagePart?.inlineData) throw new Error('Gemini returned no image')

  return {
    data: Buffer.from(imagePart.inlineData.data!, 'base64'),
    mime: imagePart.inlineData.mimeType!,
  }
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

function servicePrompt(title: string): string {
  return [
    'Generate a 1920x1080 hero image for a professional painting service page.',
    `Company: ${ORG_NAME} — "${TAGLINE}"`,
    `Service: "${title}".`,
    'Style: photorealistic, high-end residential, warm natural lighting.',
    'Show professional painters at work on a beautiful home, or a stunning finished result.',
    'The scene should convey craftsmanship, attention to detail, and premium quality.',
    'Include realistic details: clean drop cloths, professional tools, crisp paint lines.',
    'Do NOT include any text, logos, or watermarks in the image.',
    `Brand colors: primary ${BRAND.primary}, secondary ${BRAND.secondary}, accent ${BRAND.accent}. Subtly incorporate these colors where appropriate.`,
  ].join('\n')
}

function blogPrompt(title: string, excerpt: string): string {
  return [
    'Generate a 1200x630 featured image for a home improvement blog post.',
    `Company: ${ORG_NAME} — "${TAGLINE}"`,
    `Blog topic: "${title}".`,
    excerpt ? `Summary: ${excerpt}` : '',
    'Style: photorealistic, warm natural lighting, editorially compelling.',
    'The image should work well as both a blog header and an Open Graph share image.',
    'Show a scene directly related to the blog topic — real homes, real paint, real results.',
    'Do NOT include any text, logos, or watermarks in the image.',
    `Brand colors: primary ${BRAND.primary}, secondary ${BRAND.secondary}, accent ${BRAND.accent}. Subtly incorporate these colors where appropriate.`,
  ]
    .filter(Boolean)
    .join('\n')
}

function locationPrompt(city: string, state: string): string {
  return [
    'Generate a 1920x1080 hero image for a location-based painting service page.',
    `Company: ${ORG_NAME} — "${TAGLINE}"`,
    `Service: "Professional Painting" in ${city}, ${state}.`,
    `Style: photorealistic, warm and inviting.`,
    `Show a beautiful residential scene that feels like ${city}, ${state}.`,
    'Feature a well-maintained home exterior or neighborhood with professional craftsmanship visible.',
    'Do NOT include any text, logos, or watermarks in the image.',
    'The image should evoke trust, quality, and local pride.',
    `Brand colors: primary ${BRAND.primary}, secondary ${BRAND.secondary}, accent ${BRAND.accent}. Subtly incorporate these colors where appropriate.`,
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Upload + DB update
// ---------------------------------------------------------------------------

async function uploadAndUpdate(
  table: 'service_pages' | 'location_pages' | 'blog_posts',
  id: string,
  imageType: string,
  buf: Buffer,
  mime: string,
): Promise<string> {
  const ext = mime.split('/')[1] ?? 'png'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `${ORG_ID}/images/${imageType}/${filename}`

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: mime,
    upsert: false,
  })
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const publicUrl = urlData.publicUrl

  const column = table === 'blog_posts' ? 'featured_image_url' : 'hero_image_url'
  const { error: dbErr } = await supabase
    .from(table)
    .update({ [column]: publicUrl } as never)
    .eq('id', id)
  if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`)

  return publicUrl
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type PageRow = { id: string; title: string; slug: string; hero_image_url?: string | null }
type LocRow = PageRow & { city: string; state: string }
type BlogRow = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featured_image_url?: string | null
}

async function main() {
  console.log('=== Hero Image Generator ===')
  if (dryRun) console.log('  [DRY RUN — no images will be generated]')
  if (filterType) console.log(`  Filter: type=${filterType}`)
  if (filterSlug) console.log(`  Filter: slug=${filterSlug}`)
  if (skipExisting)
    console.log('  Skipping pages that already have a hero image (use --force to override)')
  console.log()

  let generated = 0
  let skipped = 0
  let errors = 0

  // --- Service pages ---
  if (!filterType || filterType === 'service') {
    let query = supabase
      .from('service_pages')
      .select('id, title, slug, hero_image_url')
      .eq('organization_id', ORG_ID)
      .eq('status', 'published' as never)
      .order('title')

    if (filterSlug) query = query.eq('slug', filterSlug)

    const { data: services, error } = await query.returns<PageRow[]>()
    if (error) throw error

    console.log(`Service pages: ${services?.length ?? 0} published`)
    for (const page of services ?? []) {
      if (skipExisting && page.hero_image_url) {
        console.log(`  SKIP ${page.slug} (already has hero image)`)
        skipped++
        continue
      }

      console.log(`  Generating: ${page.title} (${page.slug})...`)
      if (dryRun) {
        console.log('    [dry run — skipped]')
        continue
      }

      try {
        const prompt = servicePrompt(page.title)
        const { data: buf, mime } = await generateImage(prompt)
        const url = await uploadAndUpdate('service_pages', page.id, 'service_hero', buf, mime)
        console.log(`    ✓ ${url}`)
        generated++
      } catch (err) {
        console.error(`    ✗ Error: ${(err as Error).message}`)
        errors++
      }

      // Rate limit: pause between generations
      await sleep(2000)
    }
  }

  // --- Location pages ---
  if (!filterType || filterType === 'location') {
    let query = supabase
      .from('location_pages')
      .select('id, title, slug, city, state, hero_image_url')
      .eq('organization_id', ORG_ID)
      .in('status', ['published', 'review'] as never)
      .order('city')

    if (filterSlug) query = query.eq('slug', filterSlug)

    const { data: locations, error } = await query.returns<LocRow[]>()
    if (error) throw error

    console.log(`\nLocation pages: ${locations?.length ?? 0} published`)
    for (const page of locations ?? []) {
      if (skipExisting && page.hero_image_url) {
        console.log(`  SKIP ${page.slug} (already has hero image)`)
        skipped++
        continue
      }

      console.log(`  Generating: ${page.city}, ${page.state} (${page.slug})...`)
      if (dryRun) {
        console.log('    [dry run — skipped]')
        continue
      }

      try {
        const prompt = locationPrompt(page.city, page.state)
        const { data: buf, mime } = await generateImage(prompt)
        const url = await uploadAndUpdate('location_pages', page.id, 'location_hero', buf, mime)
        console.log(`    ✓ ${url}`)
        generated++
      } catch (err) {
        console.error(`    ✗ Error: ${(err as Error).message}`)
        errors++
      }

      await sleep(2000)
    }
  }

  // --- Blog posts ---
  if (!filterType || filterType === 'blog') {
    let query = supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, featured_image_url')
      .eq('organization_id', ORG_ID)
      .in('status', ['published', 'review'] as never)
      .order('title')

    if (filterSlug) query = query.eq('slug', filterSlug)

    const { data: blogs, error } = await query.returns<BlogRow[]>()
    if (error) throw error

    console.log(`\nBlog posts: ${blogs?.length ?? 0} published/review`)
    for (const post of blogs ?? []) {
      if (skipExisting && post.featured_image_url) {
        console.log(`  SKIP ${post.slug} (already has featured image)`)
        skipped++
        continue
      }

      console.log(`  Generating: ${post.title} (${post.slug})...`)
      if (dryRun) {
        console.log('    [dry run — skipped]')
        continue
      }

      try {
        const prompt = blogPrompt(post.title, post.excerpt ?? '')
        const { data: buf, mime } = await generateImage(prompt)
        const url = await uploadAndUpdate('blog_posts', post.id, 'blog_thumbnail', buf, mime)
        console.log(`    ✓ ${url}`)
        generated++
      } catch (err) {
        console.error(`    ✗ Error: ${(err as Error).message}`)
        errors++
      }

      await sleep(2000)
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`  Generated: ${generated}`)
  console.log(`  Skipped:   ${skipped}`)
  console.log(`  Errors:    ${errors}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
