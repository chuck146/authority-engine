import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { createReviewRequestSchema } from '@/types/review-requests'
import type {
  ReviewRequestListItem,
  ReviewRequestChannel,
  ReviewRequestStatus,
} from '@/types/review-requests'
import type { Json } from '@/types'

type ReviewRequestRow = {
  id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  channel: string
  review_url: string
  status: string
  sent_at: string | null
  created_at: string
}

// GET /api/v1/reviews/requests?status=pending&channel=sms
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')

    let query = supabase
      .from('review_requests' as never)
      .select(
        'id, customer_name, customer_phone, customer_email, channel, review_url, status, sent_at, created_at',
      )
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (channel) {
      query = query.eq('channel', channel)
    }

    const { data, error } = await query.returns<ReviewRequestRow[]>()

    if (error) throw error

    const items: ReviewRequestListItem[] = (data ?? []).map((row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      channel: row.channel as ReviewRequestChannel,
      reviewUrl: row.review_url,
      status: row.status as ReviewRequestStatus,
      sentAt: row.sent_at,
      createdAt: row.created_at,
    }))

    return NextResponse.json(items)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Requests List Error]', err)
    return NextResponse.json({ error: 'Failed to load review requests' }, { status: 500 })
  }
}

// POST /api/v1/reviews/requests — Create review request
export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')

    const body = await request.json()
    const parseResult = createReviewRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('review_requests' as never)
      .insert({
        organization_id: auth.organizationId,
        customer_name: input.customerName,
        customer_phone: input.customerPhone ?? null,
        customer_email: input.customerEmail ?? null,
        channel: input.channel,
        review_url: input.reviewUrl,
        status: 'pending',
        metadata: input.message ? ({ customMessage: input.message } as unknown as Json) : ({} as unknown as Json),
        created_by: auth.userId,
      } as never)
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json(
      { id: (data as { id: string }).id, status: 'pending' },
      { status: 201 },
    )
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Request Create Error]', err)
    return NextResponse.json({ error: 'Failed to create review request' }, { status: 500 })
  }
}
