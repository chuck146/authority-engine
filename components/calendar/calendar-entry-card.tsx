'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CalendarViewItem, CalendarStatus } from '@/types/calendar'

type CalendarEntryCardProps = {
  item: CalendarViewItem
  onClick?: () => void
}

const statusColors: Record<CalendarStatus, string> = {
  scheduled: 'bg-blue-500',
  publishing: 'bg-yellow-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

const contentTypeLabels: Record<string, string> = {
  service_page: 'Service',
  location_page: 'Location',
  blog_post: 'Blog',
}

export function CalendarEntryCard({ item, onClick }: CalendarEntryCardProps) {
  const time = new Date(item.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <button
      onClick={onClick}
      className="hover:bg-accent flex w-full items-start gap-1 rounded px-1 py-0.5 text-left text-xs transition-colors"
    >
      <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', statusColors[item.status])} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.contentTitle}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {contentTypeLabels[item.contentType] ?? item.contentType}
          </Badge>
          <span>{time}</span>
        </span>
      </span>
    </button>
  )
}
