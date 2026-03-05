import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { reviewResponseStatusSchema } from '@/types/reviews'
import type { ReviewResponseStatus } from '@/types/reviews'
import {
  getResponseTargetStatus,
  isValidResponseTransition,
  getResponseRequiredRole,
} from '@/lib/reviews/response-status-transitions'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PATCH /api/v1/reviews/[id]/response-status
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const body = await request.json()
    const parseResult = reviewResponseStatusSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { action, rejectionNote } = parseResult.data

    // Determine required role and authenticate
    const requiredRole = getResponseRequiredRole(action)
    if (!requiredRole) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    const auth = await requireApiRole(requiredRole)

    const supabase = await createClient()

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

    // Validate transition
    const currentStatus = current.response_status as ReviewResponseStatus
    const targetStatus = getResponseTargetStatus(action)
    if (!targetStatus || !isValidResponseTransition(currentStatus, targetStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} review response with status "${currentStatus}"` },
        { status: 422 },
      )
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      response_status: targetStatus,
      updated_at: new Date().toISOString(),
    }

    if (action === 'approve') {
      updatePayload.response_approved_by = auth.userId
      updatePayload.response_approved_at = new Date().toISOString()
    }

    if (action === 'mark_sent') {
      updatePayload.response_sent_at = new Date().toISOString()
    }

    if (action === 'reject') {
      updatePayload.metadata = { rejection_note: rejectionNote }
    }

    // Execute update
    const { error: updateError } = await supabase
      .from('reviews' as never)
      .update(updatePayload as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    return NextResponse.json({
      id,
      responseStatus: targetStatus,
      action,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Response Status Error]', err)
    return NextResponse.json({ error: 'Failed to update review response status.' }, { status: 500 })
  }
}
