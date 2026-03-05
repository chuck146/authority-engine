import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { reviewResponseEditSchema } from '@/types/reviews'
import type {
  ReviewDetail,
  ReviewPlatform,
  ReviewResponseStatus,
  ReviewSentiment,
} from '@/types/reviews'

type RouteParams = {
  params: Promise<{ id: string }>
}

type ReviewRow = {
  id: string
  platform: string
  external_id: string | null
  reviewer_name: string
  reviewer_profile_url: string | null
  rating: number
  review_text: string | null
  review_date: string
  response_text: string | null
  response_status: string
  response_generated_at: string | null
  response_approved_by: string | null
  response_approved_at: string | null
  response_sent_at: string | null
  sentiment: string | null
  sentiment_score: number | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

const EDITABLE_STATUSES: ReviewResponseStatus[] = ['pending', 'draft', 'review']

function rowToDetail(row: ReviewRow): ReviewDetail {
  return {
    id: row.id,
    platform: row.platform as ReviewPlatform,
    externalId: row.external_id,
    reviewerName: row.reviewer_name,
    reviewerProfileUrl: row.reviewer_profile_url,
    rating: row.rating,
    reviewText: row.review_text,
    reviewDate: row.review_date,
    responseText: row.response_text,
    responseStatus: row.response_status as ReviewResponseStatus,
    responseGeneratedAt: row.response_generated_at,
    responseApprovedBy: row.response_approved_by,
    responseApprovedAt: row.response_approved_at,
    responseSentAt: row.response_sent_at,
    sentiment: (row.sentiment as ReviewSentiment) ?? null,
    sentimentScore: row.sentiment_score,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// GET /api/v1/reviews/[id]
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reviews' as never)
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<ReviewRow[]>()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(rowToDetail(data))
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Detail Error]', err)
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 })
  }
}

// PUT /api/v1/reviews/[id] — Edit response text
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await requireApiRole('editor')
    const supabase = await createClient()

    const body = await request.json()
    const parseResult = reviewResponseEditSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // Fetch current status
    const { data: current, error: fetchError } = await supabase
      .from('reviews' as never)
      .select('id, response_status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string; response_status: string }[]>()
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (!EDITABLE_STATUSES.includes(current.response_status as ReviewResponseStatus)) {
      return NextResponse.json(
        { error: `Cannot edit response with status "${current.response_status}".` },
        { status: 422 },
      )
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (input.responseText !== undefined) updatePayload.response_text = input.responseText

    const { error: updateError } = await supabase
      .from('reviews' as never)
      .update(updatePayload as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    // Refetch and return
    const { data: updated, error: refetchError } = await supabase
      .from('reviews' as never)
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<ReviewRow[]>()
      .single()

    if (refetchError || !updated) throw refetchError ?? new Error('Failed to refetch')

    return NextResponse.json(rowToDetail(updated))
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Edit Error]', err)
    return NextResponse.json({ error: 'Failed to update review response' }, { status: 500 })
  }
}
