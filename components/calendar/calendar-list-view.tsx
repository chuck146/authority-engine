'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { statusColors, statusLabels, contentTypeLabels } from './calendar-constants'
import type { CalendarViewItem } from '@/types/calendar'

type CalendarListViewProps = {
  items: CalendarViewItem[]
  onEntryClick: (item: CalendarViewItem) => void
}

function formatDateHeader(date: Date): string {
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CalendarListView({ items, onEntryClick }: CalendarListViewProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, { date: Date; items: CalendarViewItem[] }>()
    const sorted = [...items].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    )

    for (const item of sorted) {
      const date = new Date(item.scheduledAt)
      const key = date.toDateString()
      const existing = map.get(key)
      if (existing) {
        existing.items.push(item)
      } else {
        map.set(key, { date, items: [item] })
      }
    }
    return Array.from(map.values())
  }, [items])

  if (items.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No scheduled content for this month.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ date, items: dayItems }) => {
        const isToday = date.toDateString() === new Date().toDateString()
        return (
          <div key={date.toDateString()}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold">{formatDateHeader(date)}</h3>
              {isToday && (
                <Badge variant="default" className="h-5 text-[10px]">
                  Today
                </Badge>
              )}
            </div>
            <div className="divide-y rounded-lg border">
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onEntryClick(item)}
                  className="hover:bg-accent flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors"
                >
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', statusColors[item.status])}
                  />
                  <span className="text-muted-foreground w-20 shrink-0">
                    {formatTime(item.scheduledAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{item.contentTitle}</span>
                  <Badge variant="outline" className="shrink-0">
                    {contentTypeLabels[item.contentType]}
                  </Badge>
                  <Badge variant="secondary" className="shrink-0">
                    {statusLabels[item.status]}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
