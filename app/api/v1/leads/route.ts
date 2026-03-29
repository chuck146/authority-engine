import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { sendLeadNotification } from '@/lib/email/resend'
import { scoreLead } from '@/lib/leads/lead-scorer'
import { isRateLimited } from '@/lib/leads/rate-limiter'
import type { OrgSettings } from '@/types'
import type { LeadListItem } from '@/types/leads'

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .min(7, 'Phone number is required')
    .max(20)
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format'),
  service: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  sms_consent: z.boolean().optional().default(false),
  org_slug: z.string().min(1).max(100),
})

// Public POST — anyone can submit a lead
export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await request.json()
    const parseResult = leadSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const now = new Date().toISOString()

    // Use admin client — this is a public endpoint (no auth), so the regular
    // client has no auth.uid() and RLS blocks the insert
    const supabase = createAdminClient()

    // Look up organization by slug (never trust client-supplied org ID)
    const { data: orgRow, error: orgErr } = await supabase
      .from('organizations')
      .select('id, settings')
      .eq('slug', input.org_slug)
      .single()

    if (orgErr || !orgRow) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const organizationId = orgRow.id as string

    // Score the lead
    const { score, scoreLabel } = scoreLead({
      service: input.service ?? null,
      message: input.message ?? null,
      phone: input.phone,
      email: input.email,
      createdAt: now,
    })

    const { data: lead, error } = await supabase
      .from('leads' as never)
      .insert({
        organization_id: organizationId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        service: input.service ?? null,
        message: input.message ?? null,
        sms_consent: input.sms_consent,
        score,
        score_label: scoreLabel,
        source: 'website',
        updated_at: now,
      } as never)
      .select('id')
      .single()

    if (error || !lead) {
      console.error('Failed to insert lead:', error)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    // Create initial activity
    const leadRow = lead as unknown as { id: string }
    await supabase.from('lead_activities' as never).insert({
      organization_id: organizationId,
      lead_id: leadRow.id,
      activity_type: 'score_change',
      description: `Lead scored ${score} (${scoreLabel}) on submission`,
      metadata: { score, scoreLabel },
    } as never)

    // Send email notification (fire-and-forget)
    const settings = orgRow.settings as unknown as OrgSettings | null
    const notifyEmail = settings?.contact_info?.email
    if (notifyEmail) {
      sendLeadNotification(notifyEmail, input).catch(() => {})
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Authenticated GET — list leads with filters
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    const params = request.nextUrl.searchParams

    const status = params.get('status')
    const source = params.get('source')
    const search = params.get('search')
    const sortBy = params.get('sortBy') ?? 'created_at'
    const sortDir = params.get('sortDir') === 'asc' ? true : false
    const page = Math.max(1, parseInt(params.get('page') ?? '1'))
    const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') ?? '25')))
    const offset = (page - 1) * limit

    const supabase = await createClient()

    let query = supabase
      .from('leads' as never)
      .select('*', { count: 'exact' })
      .eq('organization_id', auth.organizationId)

    if (status) query = query.eq('status', status)
    if (source) query = query.eq('source', source)
    if (search) {
      const maxLen = 100
      const sanitized = search.slice(0, maxLen).replace(/[%_\\]/g, '\\$&')
      query = query.or(
        `name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`,
      )
    }

    const validSortColumns = ['created_at', 'updated_at', 'score', 'name', 'status']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortColumn, { ascending: sortDir }).range(offset, offset + limit - 1)

    const { data, count, error } = await query.returns<Record<string, unknown>[]>()

    if (error) {
      console.error('Failed to fetch leads:', error)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    const items: LeadListItem[] = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      email: row.email as string,
      phone: row.phone as string,
      service: (row.service as string) ?? null,
      status: row.status as LeadListItem['status'],
      source: (row.source as LeadListItem['source']) ?? 'website',
      score: (row.score as number) ?? 0,
      scoreLabel: (row.score_label as LeadListItem['scoreLabel']) ?? null,
      assignedTo: (row.assigned_to as string) ?? null,
      createdAt: row.created_at as string,
      updatedAt: (row.updated_at as string) ?? null,
      lastActivityAt: null,
    }))

    return NextResponse.json({ items, total: count ?? 0, page, limit })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
