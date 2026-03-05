import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { contentStatusUpdateSchema } from '@/types/content'
import type { ContentStatus } from '@/types'
import {
  getTargetStatus,
  isValidTransition,
  getRequiredRole,
} from '@/lib/content/status-transitions'

type RouteParams = {
  params: Promise<{ id: string }>
}

// PATCH /api/v1/social/[id]/status
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    const body = await request.json()
    const parseResult = contentStatusUpdateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { action, rejectionNote } = parseResult.data

    // Determine required role and authenticate
    const requiredRole = getRequiredRole(action)
    if (!requiredRole) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    const auth = await requireApiRole(requiredRole)

    const supabase = await createClient()

    // Fetch current status
    const { data: current, error: fetchError } = await supabase
      .from('social_posts' as never)
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string; status: ContentStatus }[]>()
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Social post not found' }, { status: 404 })
    }

    // Validate transition
    const targetStatus = getTargetStatus(action)
    if (!targetStatus || !isValidTransition(current.status, targetStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} post with status "${current.status}"` },
        { status: 422 },
      )
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      status: targetStatus,
    }

    if (action === 'publish') {
      updatePayload.published_at = new Date().toISOString()
    }

    if (action === 'reject') {
      updatePayload.metadata = { rejection_note: rejectionNote }
    }

    // Execute update
    const { error: updateError } = await supabase
      .from('social_posts' as never)
      .update(updatePayload as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    return NextResponse.json({
      id,
      status: targetStatus,
      action,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Social Status Update Error]', err)
    return NextResponse.json({ error: 'Failed to update social post status.' }, { status: 500 })
  }
}
