/**
 * Commercial Service Content Generation Script
 *
 * Generates commercial painting service pages via Claude API,
 * inserts into commercial_service_pages with status='review',
 * and calculates SEO scores.
 *
 * Usage:
 *   npx tsx scripts/generate-commercial-services.ts
 *   npx tsx scripts/generate-commercial-services.ts --dry-run
 *   npx tsx scripts/generate-commercial-services.ts --slug=office-corporate-painting
 *
 * Requires .env.local with:
 *   ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ORG_ID = '00000000-0000-0000-0000-000000000001'
const ORG_NAME = 'Cleanest Painting LLC'
const ORG_DOMAIN = 'cleanestpaintingnj.com'
const SERVICE_AREA = 'New Jersey'
const TAGLINE = 'Where Artistry Meets Craftsmanship'

// ---------------------------------------------------------------------------
// Commercial services to generate
// ---------------------------------------------------------------------------

type CommercialServiceDef = {
  slug: string
  serviceName: string
  description: string
  keywords: string[]
}

const COMMERCIAL_SERVICES: CommercialServiceDef[] = [
  {
    slug: 'office-corporate-painting',
    serviceName: 'Office & Corporate Painting',
    description:
      'Professional painting services for corporate offices, co-working spaces, and business parks. Minimal disruption scheduling, brand color matching, and premium finishes.',
    keywords: [
      'commercial office painting NJ',
      'corporate painting contractor',
      'office renovation painting',
    ],
  },
  {
    slug: 'retail-restaurant-painting',
    serviceName: 'Retail & Restaurant Painting',
    description:
      'Painting for retail stores, restaurants, cafes, and hospitality venues. Fast turnaround to minimize downtime, food-safe coatings, and eye-catching finishes.',
    keywords: [
      'restaurant painting contractor NJ',
      'retail store painting',
      'commercial restaurant painting',
    ],
  },
  {
    slug: 'warehouse-industrial-coatings',
    serviceName: 'Warehouse & Industrial Coatings',
    description:
      'Heavy-duty coatings for warehouses, factories, and industrial facilities. Epoxy floors, safety markings, anti-corrosion coatings, and high-durability wall finishes.',
    keywords: [
      'warehouse painting NJ',
      'industrial coatings contractor',
      'epoxy floor coating New Jersey',
    ],
  },
  {
    slug: 'hoa-property-management-painting',
    serviceName: 'HOA & Property Management Painting',
    description:
      'Painting services for HOA common areas, apartment building exteriors, condo complexes, and property management companies. Volume pricing and scheduled maintenance programs.',
    keywords: [
      'HOA painting contractor NJ',
      'property management painting',
      'apartment complex painting',
    ],
  },
  {
    slug: 'multi-unit-residential-painting',
    serviceName: 'Multi-Unit Residential Painting',
    description:
      'Interior and exterior painting for multi-family residential buildings — apartments, townhome communities, and senior living facilities. Unit turnover painting and common area refresh.',
    keywords: [
      'multi-unit painting NJ',
      'apartment painting contractor',
      'townhome community painting',
    ],
  },
  {
    slug: 'healthcare-educational-facility-painting',
    serviceName: 'Healthcare & Educational Facility Painting',
    description:
      'Painting for hospitals, clinics, schools, and universities. Low-VOC and zero-VOC paints, infection-control protocols, and off-hours scheduling to avoid disruption.',
    keywords: [
      'hospital painting contractor NJ',
      'school painting services',
      'healthcare facility painting',
    ],
  },
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
const filterSlug = flagMap.get('slug')
const dryRun = flagMap.has('dry-run')

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// ---------------------------------------------------------------------------
// Content generation
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert SEO copywriter specializing in commercial painting and coatings for businesses. You write compelling, search-engine-optimized service pages that convert business owners and property managers into leads.

Company: ${ORG_NAME}
Website: ${ORG_DOMAIN}
Tagline: "${TAGLINE}"
Service Area: ${SERVICE_AREA}

Guidelines:
- Write for business owners, property managers, and facility managers searching for this service
- Include specific benefits, process steps, and reasons to choose this company
- Emphasize commercial-specific advantages: minimal disruption, off-hours scheduling, volume pricing, safety compliance
- Naturally incorporate keywords without stuffing
- Sections should cover: service overview, industries served, our process, why choose us, and service area
- Generate 4-6 sections
- Use HTML tags (<p>, <ul>, <li>, <strong>, <em>) within section body text
- meta_title should include the service name and company name (max 60 chars)
- meta_description should include a clear value proposition and call to action (max 160 chars)`

const FORMAT_INSTRUCTION = `
Return your response as valid JSON matching this exact structure:
{
  "headline": "string - compelling H1 headline",
  "intro": "string - engaging intro paragraph (2-3 sentences)",
  "sections": [
    { "title": "string - H2 section heading", "body": "string - section content (HTML allowed: <p>, <ul>, <li>, <strong>, <em>)" }
  ],
  "cta": "string - call-to-action paragraph",
  "meta_title": "string - SEO meta title (max 60 chars)",
  "meta_description": "string - SEO meta description (max 160 chars)"
}

IMPORTANT: Return ONLY the JSON object. No markdown code fences, no explanation, no preamble.`

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

async function generateContent(service: CommercialServiceDef): Promise<Record<string, unknown>> {
  const userPrompt = `Generate an SEO-optimized commercial service page for: "${service.serviceName}"

Service description: ${service.description}
Target keywords to include naturally: ${service.keywords.join(', ')}

${FORMAT_INSTRUCTION}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    temperature: 0.7,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude returned no text content')
  }

  return parseJsonResponse(textBlock.text) as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Simple SEO score (same logic as lib/seo/scorer but standalone)
// ---------------------------------------------------------------------------

function calculateSimpleSeoScore(content: Record<string, unknown>, keywords: string[]): number {
  let score = 0
  let checks = 0

  // Meta title
  const metaTitle = content.meta_title as string | undefined
  if (metaTitle && metaTitle.length >= 30 && metaTitle.length <= 60) {
    score += 100
  } else if (metaTitle) {
    score += 60
  }
  checks++

  // Meta description
  const metaDesc = content.meta_description as string | undefined
  if (metaDesc && metaDesc.length >= 120 && metaDesc.length <= 160) {
    score += 100
  } else if (metaDesc) {
    score += 60
  }
  checks++

  // Sections count
  const sections = content.sections as { title: string; body: string }[] | undefined
  if (sections && sections.length >= 4) {
    score += 100
  } else if (sections && sections.length >= 2) {
    score += 70
  }
  checks++

  // Intro present
  if (content.intro) {
    score += 100
  }
  checks++

  // CTA present
  if (content.cta) {
    score += 100
  }
  checks++

  // Keyword in title
  const headline = content.headline as string | undefined
  if (
    headline &&
    keywords.some((k) => headline.toLowerCase().includes((k.split(' ')[0] ?? k).toLowerCase()))
  ) {
    score += 100
  } else {
    score += 40
  }
  checks++

  return Math.round(score / checks)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const servicesToGenerate = filterSlug
    ? COMMERCIAL_SERVICES.filter((s) => s.slug === filterSlug)
    : COMMERCIAL_SERVICES

  if (servicesToGenerate.length === 0) {
    console.error(`No service found with slug: ${filterSlug}`)
    process.exit(1)
  }

  console.log(`\n🏢 Commercial Service Content Generator`)
  console.log(`   Generating ${servicesToGenerate.length} service page(s)`)
  if (dryRun) console.log('   [DRY RUN — no database writes]')
  console.log('')

  for (const service of servicesToGenerate) {
    console.log(`📝 Generating: ${service.serviceName}...`)

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('commercial_service_pages')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('slug', service.slug)
      .single()

    if (existing) {
      console.log(`   ⏭️  Already exists, skipping`)
      continue
    }

    // Generate content via Claude
    const content = await generateContent(service)
    const seoScore = calculateSimpleSeoScore(content, service.keywords)

    console.log(`   ✅ Content generated (SEO score: ${seoScore})`)
    console.log(`   📰 Title: ${content.meta_title}`)

    if (dryRun) {
      console.log(`   [DRY RUN] Would insert into commercial_service_pages`)
      continue
    }

    // Insert into database
    const { error } = await supabase.from('commercial_service_pages').insert({
      organization_id: ORG_ID,
      title: service.serviceName,
      slug: service.slug,
      meta_title: content.meta_title as string,
      meta_description: content.meta_description as string,
      content,
      status: 'review',
      seo_score: seoScore,
      keywords: service.keywords,
    } as never)

    if (error) {
      console.error(`   ❌ Insert failed: ${error.message}`)
    } else {
      console.log(`   💾 Inserted with status='review'`)
    }
  }

  console.log(`\n✅ Done! All commercial service pages are in 'review' status.`)
  console.log(`   Log into the dashboard to review and publish.\n`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
