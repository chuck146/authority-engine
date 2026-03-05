import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { updateScheduleSchema } from '@/types/calendar'
import type { CalendarEntry } from '@/types/calendar'
import { cancelScheduledPublish, schedulePublish } from '@/lib/queue/scheduler'

type RouteParams = { params: Promise<{ id: string }> }

// PATCH /api/v1/calendar/[id] — reschedule or cancel
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await params
    const supabase = await createClient()

    const body = await request.json()
    const parseResult = updateScheduleSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // Fetch existing entry
    const { data: entry, error: fetchError } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<CalendarEntry[]>()
      .single()

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Calendar entry not found' }, { status: 404 })
    }

    if (entry.status !== 'scheduled') {
      return NextResponse.json({ error: 'Only scheduled entries can be modified' }, { status: 422 })
    }

    // Handle cancellation
    if (input.status === 'cancelled') {
      try {
        await cancelScheduledPublish(entry.id)
      } catch (e) {
        console.warn('[Calendar PATCH] Failed to cancel BullMQ job:', e)
      }

      const { data: updated, error: updateError } = await supabase
        .from('content_calendar')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select('*')
        .returns<CalendarEntry[]>()
        .single()

      if (updateError) throw updateError
      return NextResponse.json(updated)
    }

    // Handle rescheduling
    if (input.scheduledAt) {
      if (new Date(input.scheduledAt) <= new Date()) {
        return NextResponse.json({ error: 'Scheduled time must be in the future' }, { status: 422 })
      }

      // Cancel old job, schedule new one
      try {
        await cancelScheduledPublish(entry.id)
      } catch (e) {
        console.warn('[Calendar PATCH] Failed to cancel old BullMQ job:', e)
      }

      const { data: updated, error: updateError } = await supabase
        .from('content_calendar')
        .update({ scheduled_at: input.scheduledAt })
        .eq('id', id)
        .select('*')
        .returns<CalendarEntry[]>()
        .single()

      if (updateError) throw updateError

      try {
        await schedulePublish(
          {
            calendarEntryId: entry.id,
            organizationId: auth.organizationId,
            contentType: entry.content_type,
            contentId: entry.content_id,
          },
          new Date(input.scheduledAt),
        )
      } catch (e) {
        console.warn('[Calendar PATCH] Failed to schedule BullMQ job:', e)
      }

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'No changes provided' }, { status: 400 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Calendar PATCH Error]', err)
    return NextResponse.json({ error: 'Failed to update schedule' }, { status: 500 })
  }
}
