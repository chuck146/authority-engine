import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRateLimiter } from '@/lib/leads/rate-limiter'
import { attributionSchema, classifyChannel } from '@/lib/leads/attribution'
import { MARKETING_ORG_SLUG, SITE_URL } from '@/lib/marketing/site'

// Public, anonymous conversion events from the marketing site (call clicks).
// Stores no personal data. Always answers 204 so a beacon never surfaces errors.

const eventSchema = z.object({
  event_type: z.literal('call_click'),
  page_path: z.string().trim().max(300).startsWith('/'),
  link_location: z
    .string()
    .trim()
    .max(50)
    .regex(/^[a-z0-9_-]+$/),
  attribution: attributionSchema.optional(),
})

const eventLimiter = createRateLimiter({ max: 30, windowMs: 60 * 60 * 1000 })

function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (eventLimiter.isLimited(ip)) return noContent()

    const body = await request.json().catch(() => null)
    const parsed = eventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
    }
    const event = parsed.data

    const supabase = createAdminClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', MARKETING_ORG_SLUG)
      .single()
    if (!org) return noContent()

    const channel = classifyChannel(event.attribution, new URL(SITE_URL).hostname)
    const { error } = await supabase.from('marketing_events').insert({
      organization_id: org.id,
      event_type: event.event_type,
      page_path: event.page_path,
      link_location: event.link_location,
      channel,
      attribution: event.attribution ?? {},
    })

    // A lost click count must never fail the page.
    if (error) console.warn('[events] insert failed:', error.message)

    return noContent()
  } catch {
    return noContent()
  }
}
