import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { enqueueSmsJob } from '@/lib/queue/sms-scheduler'

// POST /api/v1/reviews/requests/[id]/send — Trigger SMS send
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await params
    const supabase = await createClient()

    // Fetch the request to verify ownership and status
    const { data, error } = await supabase
      .from('review_requests' as never)
      .select('id, status, customer_phone')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Review request not found' }, { status: 404 })
    }

    const row = data as { id: string; status: string; customer_phone: string | null }

    // Only allow sending pending or failed requests
    if (row.status !== 'pending' && row.status !== 'failed') {
      return NextResponse.json(
        {
          error: `Cannot send request with status "${row.status}". Only pending or failed requests can be sent.`,
        },
        { status: 400 },
      )
    }

    if (!row.customer_phone) {
      return NextResponse.json(
        { error: 'No phone number provided for this request' },
        { status: 400 },
      )
    }

    // Enqueue the SMS job
    const jobId = await enqueueSmsJob(id, auth.organizationId)

    return NextResponse.json({ jobId, status: 'queued' })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Request Send Error]', err)
    return NextResponse.json({ error: 'Failed to send review request' }, { status: 500 })
  }
}
