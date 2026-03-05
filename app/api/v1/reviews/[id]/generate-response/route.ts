import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { generateReviewResponse } from '@/lib/ai/review-response-generator'
import { generateResponseSchema } from '@/types/reviews'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { OrgBranding, Json } from '@/types'

type RouteParams = {
  params: Promise<{ id: string }>
}

type ReviewRow = {
  id: string
  reviewer_name: string
  rating: number
  review_text: string | null
  platform: string
  response_status: string
}

// POST /api/v1/reviews/[id]/generate-response
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await requireApiRole('editor')

    const body = await request.json()
    const parseResult = generateResponseSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const supabase = await createClient()

    // Fetch the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews' as never)
      .select('id, reviewer_name, rating, review_text, platform, response_status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<ReviewRow[]>()
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Only generate for pending or draft responses
    if (!['pending', 'draft'].includes(review.response_status)) {
      return NextResponse.json(
        { error: `Cannot generate response for review with status "${review.response_status}"` },
        { status: 422 },
      )
    }

    // Load org context
    const { data: org } = await supabase
      .from('organizations')
      .select('name, domain, branding, settings')
      .eq('id', auth.organizationId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const branding = org.branding as OrgBranding | null
    const settings = org.settings as Record<string, unknown> | null

    const orgContext: OrgContext = {
      orgName: org.name,
      domain: org.domain,
      branding,
      serviceAreaStates: (settings?.service_area_states as string[]) ?? undefined,
      serviceAreaCounties: (settings?.service_area_counties as string[]) ?? undefined,
    }

    // Generate response via Claude
    const generated = await generateReviewResponse(
      input,
      {
        reviewerName: review.reviewer_name,
        rating: review.rating,
        reviewText: review.review_text,
        platform: review.platform,
      },
      orgContext,
    )

    // Update the review with generated response
    const { error: updateError } = await supabase
      .from('reviews' as never)
      .update({
        response_text: generated.response_text,
        response_status: 'review',
        response_generated_at: new Date().toISOString(),
        sentiment: generated.sentiment,
        sentiment_score: generated.sentiment_score,
        metadata: { key_themes: generated.key_themes } as unknown as Json,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    return NextResponse.json({
      id,
      responseText: generated.response_text,
      responseStatus: 'review',
      sentiment: generated.sentiment,
      sentimentScore: generated.sentiment_score,
      keyThemes: generated.key_themes,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Generate Response Error]', err)
    return NextResponse.json(
      { error: 'Failed to generate review response. Please try again.' },
      { status: 500 },
    )
  }
}
