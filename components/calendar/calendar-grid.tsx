'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { CalendarEntryCard } from './calendar-entry-card'
import type { CalendarViewItem } from '@/types/calendar'

type CalendarGridProps = {
  items: CalendarViewItem[]
  month: number
  year: number
  onEntryClick?: (item: CalendarViewItem) => void
}

function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Pad with days from previous month to fill the first week
  const startDayOfWeek = firstDay.getDay()
  const days: Date[] = []

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    days.push(d)
  }

  // Days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month - 1, d))
  }

  // Pad with days from next month to fill the last week
  while (days.length % 7 !== 0) {
    const d = days.length - startDayOfWeek - lastDay.getDate() + 1
    days.push(new Date(year, month, d))
  }

  return days
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarGrid({ items, month, year, onEntryClick }: CalendarGridProps) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarViewItem[]>()
    for (const item of items) {
      const date = new Date(item.scheduledAt)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [items])

  return (
    <div className="rounded-lg border">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-muted-foreground p-2 text-center text-xs font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((date, i) => {
          const isCurrentMonth = date.getMonth() === month - 1
          const isToday =
            date.toDateString() === new Date().toDateString()
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          const dayItems = itemsByDay.get(key) ?? []

          return (
            <div
              key={i}
              className={cn(
                'min-h-[100px] border-b border-r p-1.5 last:border-r-0',
                !isCurrentMonth && 'bg-muted/30',
              )}
            >
              <span
                className={cn(
                  'mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday && 'bg-primary text-primary-foreground font-bold',
                  !isCurrentMonth && 'text-muted-foreground',
                )}
              >
                {date.getDate()}
              </span>
              <div className="space-y-0.5">
                {dayItems.slice(0, 3).map((item) => (
                  <CalendarEntryCard
                    key={item.id}
                    item={item}
                    onClick={() => onEntryClick?.(item)}
                  />
                ))}
                {dayItems.length > 3 && (
                  <span className="text-muted-foreground px-1 text-xs">
                    +{dayItems.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
