import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { updateLeadSchema } from '@/types/leads'
import { isValidLeadTransition } from '@/lib/leads/status-transitions'
import type { LeadDetail, LeadActivity, LeadFollowup, LeadStatus } from '@/types/leads'

type RouteContext = { params: Promise<{ id: string }> }

type LeadRow = {
  id: string
  name: string
  email: string
  phone: string
  service: string | null
  message: string | null
  status: string
  source: string
  score: number
  score_label: string | null
  assigned_to: string | null
  notes: string | null
  contacted_at: string | null
  closed_at: string | null
  close_reason: string | null
  created_at: string
  updated_at: string | null
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireApiAuth()
    const { id } = await context.params
    const supabase = await createClient()

    const { data: lead, error } = await supabase
      .from('leads' as never)
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<LeadRow[]>()
      .single()

    if (error || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Fetch activities
    const { data: activities } = await supabase
      .from('lead_activities' as never)
      .select('*')
      .eq('lead_id', id)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<Record<string, unknown>[]>()

    // Fetch followups
    const { data: followups } = await supabase
      .from('lead_followups' as never)
      .select('*')
      .eq('lead_id', id)
      .eq('organization_id', auth.organizationId)
      .order('scheduled_at', { ascending: true })
      .returns<Record<string, unknown>[]>()

    const detail: LeadDetail = {
      id: lead.id as string,
      name: lead.name as string,
      email: lead.email as string,
      phone: lead.phone as string,
      service: (lead.service as string) ?? null,
      message: (lead.message as string) ?? null,
      status: lead.status as LeadStatus,
      source: (lead.source as LeadDetail['source']) ?? 'website',
      score: (lead.score as number) ?? 0,
      scoreLabel: (lead.score_label as LeadDetail['scoreLabel']) ?? null,
      assignedTo: (lead.assigned_to as string) ?? null,
      notes: (lead.notes as string) ?? null,
      contactedAt: (lead.contacted_at as string) ?? null,
      closedAt: (lead.closed_at as string) ?? null,
      closeReason: (lead.close_reason as string) ?? null,
      createdAt: lead.created_at as string,
      updatedAt: (lead.updated_at as string) ?? null,
      activities: (activities ?? []).map(
        (a): LeadActivity => ({
          id: a.id as string,
          activityType: a.activity_type as LeadActivity['activityType'],
          description: a.description as string,
          metadata: (a.metadata as Record<string, unknown>) ?? {},
          createdBy: (a.created_by as string) ?? null,
          createdAt: a.created_at as string,
        }),
      ),
      followups: (followups ?? []).map(
        (f): LeadFollowup => ({
          id: f.id as string,
          sequenceName: f.sequence_name as string,
          stepNumber: f.step_number as number,
          channel: f.channel as LeadFollowup['channel'],
          messageTemplate: f.message_template as string,
          scheduledAt: f.scheduled_at as string,
          status: f.status as LeadFollowup['status'],
          sentAt: (f.sent_at as string) ?? null,
          errorMessage: (f.error_message as string) ?? null,
        }),
      ),
    }

    return NextResponse.json(detail)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await context.params
    const body = await request.json()

    const parseResult = updateLeadSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data
    const supabase = await createClient()

    // Fetch current lead
    const { data: current, error: fetchErr } = await supabase
      .from('leads' as never)
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<LeadRow[]>()
      .single()

    if (fetchErr || !current) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() }
    const activitiesToCreate: {
      type: string
      description: string
      metadata?: Record<string, unknown>
    }[] = []

    // Status change
    if (input.status && input.status !== current.status) {
      if (!isValidLeadTransition(current.status as LeadStatus, input.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${current.status} to ${input.status}` },
          { status: 400 },
        )
      }

      // Require admin for win/lose
      if (
        (input.status === 'won' || input.status === 'lost') &&
        auth.role !== 'admin' &&
        auth.role !== 'owner'
      ) {
        return NextResponse.json({ error: 'Admin required for win/lose' }, { status: 403 })
      }

      updateFields.status = input.status
      activitiesToCreate.push({
        type: 'status_change',
        description: `Status changed from ${current.status} to ${input.status}`,
        metadata: { from: current.status, to: input.status },
      })

      if (input.status === 'contacted' && !current.contacted_at) {
        updateFields.contacted_at = new Date().toISOString()
      }
      if (input.status === 'won' || input.status === 'lost') {
        updateFields.closed_at = new Date().toISOString()
      }
      if (input.status === 'new') {
        // Reopen
        updateFields.closed_at = null
        updateFields.close_reason = null
      }
    }

    if (input.close_reason !== undefined) updateFields.close_reason = input.close_reason
    if (input.notes !== undefined) updateFields.notes = input.notes
    if (input.source !== undefined) updateFields.source = input.source

    if (input.assigned_to !== undefined && input.assigned_to !== current.assigned_to) {
      // Validate assigned user belongs to the same organization
      if (input.assigned_to !== null) {
        const { data: assignee } = await supabase
          .from('user_organizations')
          .select('user_id')
          .eq('user_id', input.assigned_to)
          .eq('organization_id', auth.organizationId)
          .single()

        if (!assignee) {
          return NextResponse.json(
            { error: 'Assigned user not found in this organization' },
            { status: 400 },
          )
        }
      }

      updateFields.assigned_to = input.assigned_to
      activitiesToCreate.push({
        type: 'assignment_change',
        description: input.assigned_to
          ? `Lead assigned to ${input.assigned_to}`
          : 'Lead unassigned',
        metadata: { from: current.assigned_to, to: input.assigned_to },
      })
    }

    const { error: updateErr } = await supabase
      .from('leads' as never)
      .update(updateFields as never)
      .eq('id', id)
      .eq('organization_id', auth.organizationId)

    if (updateErr) {
      console.error('Failed to update lead:', updateErr)
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
    }

    // Create activities
    for (const act of activitiesToCreate) {
      await supabase.from('lead_activities' as never).insert({
        organization_id: auth.organizationId,
        lead_id: id,
        activity_type: act.type,
        description: act.description,
        metadata: act.metadata ?? {},
        created_by: auth.userId,
      } as never)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
