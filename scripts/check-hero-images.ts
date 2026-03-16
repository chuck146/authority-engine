/**
 * Hero Image Diagnostic Script
 *
 * Checks Supabase Storage for existing hero images and reports
 * the current state of hero_image_url / featured_image_url in the database.
 *
 * Usage:
 *   npx tsx scripts/check-hero-images.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const BUCKET = 'media'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const IMAGE_DIRS = ['service_hero', 'location_hero', 'blog_thumbnail'] as const

async function main() {
  console.log('=== Hero Image Diagnostic ===\n')

  // --- Check Supabase Storage ---
  console.log('--- Supabase Storage ---')
  for (const dir of IMAGE_DIRS) {
    const path = `${ORG_ID}/images/${dir}`
    const { data: files, error } = await supabase.storage.from(BUCKET).list(path)

    if (error) {
      console.log(`\n${dir}/: ERROR — ${error.message}`)
      continue
    }

    const imageFiles = (files ?? []).filter((f) => !f.id?.startsWith('.'))
    console.log(`\n${dir}/: ${imageFiles.length} file(s)`)

    for (const file of imageFiles) {
      const size = file.metadata?.size
        ? `${Math.round(Number(file.metadata.size) / 1024)}KB`
        : 'unknown size'
      console.log(`  ${file.name}  (${size}, created: ${file.created_at ?? 'unknown'})`)
    }
  }

  // --- Check Database ---
  console.log('\n\n--- Database: hero_image_url status ---')

  // Service pages
  const { data: services } = await supabase
    .from('service_pages')
    .select('title, slug, hero_image_url, status')
    .eq('organization_id', ORG_ID)
    .order('title')

  console.log(`\nService pages (${services?.length ?? 0} total):`)
  for (const p of services ?? []) {
    const status = p.hero_image_url ? 'HAS IMAGE' : 'NULL'
    console.log(`  [${status}] ${p.title} (${p.slug}) — ${p.status}`)
  }

  // Location pages
  const { data: locations } = await supabase
    .from('location_pages')
    .select('title, slug, hero_image_url, status')
    .eq('organization_id', ORG_ID)
    .order('title')

  console.log(`\nLocation pages (${locations?.length ?? 0} total):`)
  for (const p of locations ?? []) {
    const status = p.hero_image_url ? 'HAS IMAGE' : 'NULL'
    console.log(`  [${status}] ${p.title} (${p.slug}) — ${p.status}`)
  }

  // Blog posts
  const { data: blogs } = await supabase
    .from('blog_posts')
    .select('title, slug, featured_image_url, status')
    .eq('organization_id', ORG_ID)
    .order('title')

  console.log(`\nBlog posts (${blogs?.length ?? 0} total):`)
  for (const p of blogs ?? []) {
    const status = p.featured_image_url ? 'HAS IMAGE' : 'NULL'
    console.log(`  [${status}] ${p.title} (${p.slug}) — ${p.status}`)
  }

  // Summary
  const totalPages = (services?.length ?? 0) + (locations?.length ?? 0) + (blogs?.length ?? 0)
  const withImage =
    (services?.filter((p) => p.hero_image_url).length ?? 0) +
    (locations?.filter((p) => p.hero_image_url).length ?? 0) +
    (blogs?.filter((p) => p.featured_image_url).length ?? 0)
  const missing = totalPages - withImage

  console.log(`\n--- Summary ---`)
  console.log(`  Total pages: ${totalPages}`)
  console.log(`  With image:  ${withImage}`)
  console.log(`  Missing:     ${missing}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
