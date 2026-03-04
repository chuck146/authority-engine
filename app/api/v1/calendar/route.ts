import { NextResponse } from 'next/server'
import { requireApiAuth, requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { calendarQuerySchema, scheduleContentSchema } from '@/types/calendar'
import type { CalendarEntry, CalendarViewItem } from '@/types/calendar'
import type { ContentType } from '@/types/content'
import { schedulePublish } from '@/lib/queue/scheduler'

// Table names for each content type
const tableMap = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
} as const satisfies Record<ContentType, string>

type ContentRow = { id: string; title: string }

// GET /api/v1/calendar?month=3&year=2026
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const parseResult = calendarQuerySchema.safeParse({
      month: searchParams.get('month'),
      year: searchParams.get('year'),
    })

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid query params', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { month, year } = parseResult.data

    // Build date range for the month
    const startDate = new Date(year, month - 1, 1).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

    // Fetch calendar entries for the month
    const { data: entries, error } = await supabase
      .from('content_calendar')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .order('scheduled_at', { ascending: true })
      .returns<CalendarEntry[]>()

    if (error) throw error

    // Batch-fetch content titles per type
    const entriesByType = new Map<ContentType, CalendarEntry[]>()
    for (const entry of entries ?? []) {
      const type = entry.content_type as ContentType
      const list = entriesByType.get(type) ?? []
      list.push(entry)
      entriesByType.set(type, list)
    }

    const titleMap = new Map<string, string>()

    for (const [type, typeEntries] of entriesByType) {
      const contentIds = typeEntries.map((e) => e.content_id)
      const { data: rows } = await supabase
        .from(tableMap[type])
        .select('id, title')
        .in('id', contentIds)
        .returns<ContentRow[]>()

      for (const row of rows ?? []) {
        titleMap.set(row.id, row.title)
      }
    }

    // Map to view items
    const items: CalendarViewItem[] = (entries ?? []).map((entry) => ({
      id: entry.id,
      contentType: entry.content_type as ContentType,
      contentId: entry.content_id,
      contentTitle: titleMap.get(entry.content_id) ?? 'Untitled',
      scheduledAt: entry.scheduled_at,
      publishedAt: entry.published_at,
      status: entry.status,
      errorMessage: entry.error_message,
    }))

    return NextResponse.json(items)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Calendar GET Error]', err)
    return NextResponse.json({ error: 'Failed to load calendar' }, { status: 500 })
  }
}

// POST /api/v1/calendar — schedule content for publishing
export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')
    const supabase = await createClient()

    const body = await request.json()
    const parseResult = scheduleContentSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { contentType, contentId, scheduledAt } = parseResult.data

    // Verify scheduled time is in the future
    if (new Date(scheduledAt) <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 422 },
      )
    }

    // Verify content exists and is in approved status
    const table = tableMap[contentType]
    const { data: content, error: contentError } = await supabase
      .from(table)
      .select('id, status')
      .eq('id', contentId)
      .eq('organization_id', auth.organizationId)
      .returns<{ id: string; status: string }[]>()
      .single()

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    if (content.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved content can be scheduled for publishing' },
        { status: 422 },
      )
    }

    // Insert calendar entry
    const { data: entry, error: insertError } = await supabase
      .from('content_calendar')
      .insert({
        organization_id: auth.organizationId,
        content_type: contentType,
        content_id: contentId,
        scheduled_at: scheduledAt,
        created_by: auth.userId,
      })
      .select('*')
      .returns<CalendarEntry[]>()
      .single()

    if (insertError) {
      // Unique constraint violation — already scheduled
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This content is already scheduled for publishing' },
          { status: 409 },
        )
      }
      throw insertError
    }

    // Schedule the BullMQ job
    await schedulePublish(
      {
        calendarEntryId: entry.id,
        organizationId: auth.organizationId,
        contentType,
        contentId,
      },
      new Date(scheduledAt),
    )

    return NextResponse.json(entry, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Calendar POST Error]', err)
    return NextResponse.json({ error: 'Failed to schedule content' }, { status: 500 })
  }
}
