import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import { CalendarPageClient } from '@/components/calendar/calendar-page-client'
import type { CalendarEntry, CalendarViewItem } from '@/types/calendar'
import type { ContentType } from '@/types/content'

export const metadata: Metadata = { title: 'Content Calendar' }

const tableMap = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
} as const satisfies Record<ContentType, string>

type ContentRow = { id: string; title: string }

export default async function CalendarPage() {
  const auth = await requireAuth()
  const supabase = await createClient()

  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const startDate = new Date(year, month - 1, 1).toISOString()
  const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

  const { data: entries } = await supabase
    .from('content_calendar')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .gte('scheduled_at', startDate)
    .lte('scheduled_at', endDate)
    .order('scheduled_at', { ascending: true })
    .returns<CalendarEntry[]>()

  // Batch-fetch content titles
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Calendar</h1>
        <p className="text-muted-foreground">
          Schedule and track content publishing across all channels.
        </p>
      </div>
      <CalendarPageClient
        initialItems={items}
        initialMonth={month}
        initialYear={year}
        userRole={auth.role}
      />
    </div>
  )
}
