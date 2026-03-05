import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/google/token-manager'
import { replyToReview } from '@/lib/google/business-profile'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireApiRole('admin')
    const { id } = await params
    const supabase = await createClient()

    // Fetch the review
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select(
        'id, platform, external_id, response_text, response_status, metadata, organization_id',
      )
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (fetchError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Validate: must be a Google review
    if (review.platform !== 'google') {
      return NextResponse.json(
        { error: 'Post reply is only available for Google reviews' },
        { status: 422 },
      )
    }

    // Validate: must have an approved response
    if (review.response_status !== 'approved') {
      return NextResponse.json(
        { error: 'Response must be approved before posting' },
        { status: 422 },
      )
    }

    if (!review.response_text) {
      return NextResponse.json({ error: 'No response text to post' }, { status: 422 })
    }

    // Get the GBP review name from metadata
    const metadata = review.metadata as Record<string, unknown> | null
    const gbpReviewName = metadata?.gbp_review_name as string | undefined

    if (!gbpReviewName) {
      return NextResponse.json(
        { error: 'Review is missing GBP metadata. It may have been manually created.' },
        { status: 422 },
      )
    }

    // Get GBP access token
    const { accessToken } = await getValidToken(auth.organizationId, 'business_profile')

    // Post the reply to Google
    await replyToReview({
      accessToken,
      reviewName: gbpReviewName,
      comment: review.response_text,
    })

    // Update review status to 'sent'
    const now = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('reviews')
      .update({
        response_status: 'sent',
        response_sent_at: now,
        metadata: {
          ...(metadata ?? {}),
          has_reply: true,
          reply_posted_at: now,
        },
        updated_at: now,
      } as never)
      .eq('id', id)

    if (updateError) {
      console.error('[Post Reply] DB update error:', updateError)
      // Reply was posted but status update failed — log but don't fail
    }

    return NextResponse.json({
      success: true,
      id: review.id,
      responseStatus: 'sent',
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Post Reply Error]', err)
    return NextResponse.json({ error: 'Failed to post reply to Google' }, { status: 500 })
  }
}
