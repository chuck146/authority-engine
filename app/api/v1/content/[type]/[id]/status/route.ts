import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { contentTypeSchema, contentStatusUpdateSchema, type ContentType } from '@/types/content'
import type { ContentStatus } from '@/types'
import { getTargetStatus, isValidTransition, getRequiredRole } from '@/lib/content/status-transitions'

type RouteParams = {
  params: Promise<{ type: string; id: string }>
}

const TABLE_MAP = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
} as const satisfies Record<ContentType, string>

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { type, id } = await params

    // 1. Validate content type
    const typeResult = contentTypeSchema.safeParse(type)
    if (!typeResult.success) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const parseResult = contentStatusUpdateSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { action, rejectionNote } = parseResult.data

    // 3. Determine required role and authenticate
    const requiredRole = getRequiredRole(action)
    if (!requiredRole) {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    const auth = await requireApiRole(requiredRole)

    // 4. Fetch current content status
    const tableName = TABLE_MAP[typeResult.data]
    const supabase = await createClient()

    const { data: current, error: fetchError } = await supabase
      .from(tableName)
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string; status: ContentStatus }[]>()
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // 5. Validate transition
    const targetStatus = getTargetStatus(action)
    if (!targetStatus || !isValidTransition(current.status, targetStatus)) {
      return NextResponse.json(
        { error: `Cannot ${action} content with status "${current.status}"` },
        { status: 422 },
      )
    }

    // 6. Build update payload
    const updatePayload: Record<string, unknown> = {
      status: targetStatus,
    }

    if (action === 'approve') {
      updatePayload.approved_by = auth.userId
      updatePayload.approved_at = new Date().toISOString()
      updatePayload.rejection_note = null
    }

    if (action === 'reject') {
      updatePayload.rejection_note = rejectionNote
      updatePayload.approved_by = null
      updatePayload.approved_at = null
    }

    if (action === 'publish') {
      updatePayload.published_at = new Date().toISOString()
    }

    // 7. Execute update
    const { error: updateError } = await supabase
      .from(tableName)
      .update(updatePayload as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateError) throw updateError

    // 8. Revalidate SSR page cache after publish
    if (action === 'publish') {
      const pathMap: Record<ContentType, string> = {
        service_page: '/services/',
        location_page: '/locations/',
        blog_post: '/blog/',
      }
      const { data: published } = await supabase
        .from(tableName)
        .select('slug')
        .eq('id', id)
        .returns<{ slug: string }[]>()
        .single()

      if (published) {
        revalidatePath(pathMap[typeResult.data] + published.slug)
      }
    }

    // 9. Return updated status
    return NextResponse.json({
      id,
      type: typeResult.data,
      status: targetStatus,
      action,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Content Status Update Error]', err)
    return NextResponse.json(
      { error: 'Failed to update content status. Please try again.' },
      { status: 500 },
    )
  }
}
