/**
 * Blog Thumbnail Generation Script
 *
 * Generates a featured image for a specific blog post using Gemini Flash Image
 * and uploads to Supabase Storage, then updates featured_image_url on the post.
 *
 * Usage:
 *   npx tsx scripts/generate-blog-thumbnail.ts --slug=choose-right-paint-color
 *   npx tsx scripts/generate-blog-thumbnail.ts --slug=choose-right-paint-color --dry-run
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const ORG_NAME = 'Cleanest Painting LLC'
const BRAND = { primary: '#1B2B5B', secondary: '#fbbf24', accent: '#1e3a5f' }
const BUCKET = 'media'

// Arg parsing
const args = process.argv.slice(2)
const flagMap = new Map<string, string>()
for (const arg of args) {
  const m = arg.match(/^--(\w[\w-]*)(?:=(.*))?$/)
  if (m?.[1]) flagMap.set(m[1], m[2] ?? 'true')
}
const slug = flagMap.get('slug')
const dryRun = flagMap.has('dry-run')

if (!slug) {
  console.error('Usage: npx tsx scripts/generate-blog-thumbnail.ts --slug=<blog-slug>')
  process.exit(1)
}

// Clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)
const gemini = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY! })

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

function blogThumbnailPrompt(title: string, topic: string): string {
  return [
    'Generate a 1200x630 blog thumbnail image for a home improvement painting company.',
    `Company: ${ORG_NAME}`,
    `Blog post: "${title}"`,
    `Topic: ${topic}`,
    'Style: photorealistic, warm, inviting, editorial quality.',
    'Show an appealing scene related to choosing paint colors — color swatches, paint cans with beautiful colors, or a freshly painted room with harmonious color choices.',
    'The image should be visually compelling and work well as both a blog header and Open Graph social share image.',
    'Do NOT include any text, logos, or watermarks in the image.',
    `Brand colors: primary ${BRAND.primary}, secondary ${BRAND.secondary}, accent ${BRAND.accent}. Subtly incorporate where appropriate.`,
  ].join('\n')
}

async function main() {
  console.log(`=== Blog Thumbnail Generator ===`)
  console.log(`  Slug: ${slug}`)
  if (dryRun) console.log('  [DRY RUN]')

  // Fetch the blog post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, featured_image_url')
    .eq('organization_id', ORG_ID)
    .eq('slug', slug)
    .single()

  if (error || !post) {
    console.error(`Blog post not found: ${slug}`)
    process.exit(1)
  }

  if (post.featured_image_url) {
    console.log(`  Post already has featured_image_url: ${post.featured_image_url}`)
    console.log('  Use --force to overwrite (not implemented, just delete the URL first)')
    return
  }

  console.log(`  Title: ${post.title}`)
  console.log(`  Generating thumbnail...`)

  if (dryRun) {
    console.log('  [dry run — skipped]')
    return
  }

  const prompt = blogThumbnailPrompt(post.title, 'Choosing the right paint color for your home')
  const { data: buf, mime } = await generateImage(prompt)

  // Upload to storage
  const ext = mime.split('/')[1] ?? 'png'
  const filename = `${crypto.randomUUID()}.${ext}`
  const storagePath = `${ORG_ID}/images/blog_thumbnail/${filename}`

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
    contentType: mime,
    upsert: false,
  })
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const publicUrl = urlData.publicUrl

  // Update blog post
  const { error: dbErr } = await supabase
    .from('blog_posts')
    .update({ featured_image_url: publicUrl } as never)
    .eq('id', post.id)
  if (dbErr) throw new Error(`DB update failed: ${dbErr.message}`)

  console.log(`  ✓ Thumbnail uploaded: ${publicUrl}`)
  console.log(`  ✓ featured_image_url updated on blog post`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
