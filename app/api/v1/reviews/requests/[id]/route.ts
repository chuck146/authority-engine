import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type {
  ReviewRequestDetail,
  ReviewRequestChannel,
  ReviewRequestStatus,
} from '@/types/review-requests'

type ReviewRequestDetailRow = {
  id: string
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  channel: string
  review_url: string
  status: string
  sent_at: string | null
  delivered_at: string | null
  completed_at: string | null
  review_id: string | null
  error_message: string | null
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
}

// GET /api/v1/reviews/requests/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireApiAuth()
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('review_requests' as never)
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Review request not found' }, { status: 404 })
      }
      throw error
    }

    const row = data as unknown as ReviewRequestDetailRow

    const detail: ReviewRequestDetail = {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      channel: row.channel as ReviewRequestChannel,
      reviewUrl: row.review_url,
      status: row.status as ReviewRequestStatus,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      completedAt: row.completed_at,
      reviewId: row.review_id,
      errorMessage: row.error_message,
      metadata: row.metadata ?? {},
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }

    return NextResponse.json(detail)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Request Detail Error]', err)
    return NextResponse.json({ error: 'Failed to load review request' }, { status: 500 })
  }
}
