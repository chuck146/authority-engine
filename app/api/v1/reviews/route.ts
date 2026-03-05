import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { createReviewSchema } from '@/types/reviews'
import type { ReviewListItem, ReviewPlatform, ReviewResponseStatus } from '@/types/reviews'
import type { Json } from '@/types'

type ReviewRow = {
  id: string
  platform: string
  reviewer_name: string
  rating: number
  review_text: string | null
  review_date: string
  response_status: string
  sentiment: string | null
  created_at: string
}

// GET /api/v1/reviews?platform=google&rating=5&responseStatus=pending
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const rating = searchParams.get('rating')
    const responseStatus = searchParams.get('responseStatus')

    let query = supabase
      .from('reviews' as never)
      .select(
        'id, platform, reviewer_name, rating, review_text, review_date, response_status, sentiment, created_at',
      )
      .eq('organization_id', auth.organizationId)
      .order('review_date', { ascending: false })

    if (platform) {
      query = query.eq('platform', platform)
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating, 10))
    }

    if (responseStatus) {
      query = query.eq('response_status', responseStatus)
    }

    const { data, error } = await query.returns<ReviewRow[]>()

    if (error) throw error

    const items: ReviewListItem[] = (data ?? []).map((row) => ({
      id: row.id,
      platform: row.platform as ReviewPlatform,
      reviewerName: row.reviewer_name,
      rating: row.rating,
      reviewText: row.review_text,
      reviewDate: row.review_date,
      responseStatus: row.response_status as ReviewResponseStatus,
      sentiment: (row.sentiment as ReviewListItem['sentiment']) ?? null,
      createdAt: row.created_at,
    }))

    return NextResponse.json(items)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Reviews List Error]', err)
    return NextResponse.json({ error: 'Failed to load reviews' }, { status: 500 })
  }
}

// POST /api/v1/reviews — Manual review entry
export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')

    const body = await request.json()
    const parseResult = createReviewSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('reviews' as never)
      .insert({
        organization_id: auth.organizationId,
        platform: input.platform,
        external_id: input.externalId ?? null,
        reviewer_name: input.reviewerName,
        reviewer_profile_url: input.reviewerProfileUrl ?? null,
        rating: input.rating,
        review_text: input.reviewText ?? null,
        review_date: input.reviewDate,
        response_status: 'pending',
        metadata: {} as unknown as Json,
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
    console.error('[Review Create Error]', err)
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
  }
}
