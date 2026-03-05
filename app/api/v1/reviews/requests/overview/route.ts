import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type { ReviewRequestOverview } from '@/types/review-requests'

type StatusRow = {
  status: string
}

// GET /api/v1/reviews/requests/overview
export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('review_requests' as never)
      .select('status')
      .eq('organization_id', auth.organizationId)
      .returns<StatusRow[]>()

    if (error) throw error

    const rows = data ?? []
    const counts = { pending: 0, sent: 0, delivered: 0, completed: 0, failed: 0, opened: 0 }

    for (const row of rows) {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts]++
      }
    }

    const overview: ReviewRequestOverview = {
      total: rows.length,
      pending: counts.pending,
      sent: counts.sent,
      delivered: counts.delivered,
      completed: counts.completed,
      failed: counts.failed,
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Request Overview Error]', err)
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
  }
}
