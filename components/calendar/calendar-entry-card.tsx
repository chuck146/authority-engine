'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import {
  statusColors,
  statusLabels,
  contentTypeLabels,
  contentTypeBorderColors,
} from './calendar-constants'
import type { CalendarViewItem } from '@/types/calendar'

type CalendarEntryCardProps = {
  item: CalendarViewItem
  onClick?: () => void
}

export function CalendarEntryCard({ item, onClick }: CalendarEntryCardProps) {
  const time = new Date(item.scheduledAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <button
      onClick={onClick}
      className={cn(
        'hover:bg-accent flex w-full items-start gap-1 rounded border-l-2 px-1 py-0.5 text-left text-xs transition-colors',
        contentTypeBorderColors[item.contentType],
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', statusColors[item.status])}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {statusLabels[item.status]}
        </TooltipContent>
      </Tooltip>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{item.contentTitle}</span>
        <span className="text-muted-foreground flex items-center gap-1">
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {contentTypeLabels[item.contentType]}
          </Badge>
          <span>{time}</span>
        </span>
      </span>
    </button>
  )
}
