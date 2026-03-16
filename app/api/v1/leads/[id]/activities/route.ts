import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createActivitySchema } from '@/types/leads'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await context.params
    const body = await request.json()

    const parseResult = createActivitySchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const supabase = await createClient()

    // Verify lead belongs to org
    const { data: lead } = await supabase
      .from('leads' as never)
      .select('id')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string }[]>()
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const { error } = await supabase.from('lead_activities' as never).insert({
      organization_id: auth.organizationId,
      lead_id: id,
      activity_type: input.activityType,
      description: input.description,
      metadata: input.metadata ?? {},
      created_by: auth.userId,
    } as never)

    if (error) {
      console.error('Failed to create activity:', error)
      return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
