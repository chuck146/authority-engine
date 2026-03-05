'use client'

import { Badge } from '@/components/ui/badge'
import type { RecentActivityItem } from '@/types/dashboard'

type RecentActivityProps = {
  items: RecentActivityItem[]
}

const typeLabels: Record<string, string> = {
  service_page: 'Service',
  location_page: 'Location',
  blog_post: 'Blog',
}

function formatRelativeTime(isoDate: string): string {
  const now = new Date()
  const date = new Date(isoDate)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) {
    return <div className="text-muted-foreground text-sm">No published content yet.</div>
  }

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          className="hover:bg-muted/50 flex items-center justify-between rounded-md px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Badge variant="outline" className="shrink-0">
              {typeLabels[item.contentType] ?? item.contentType}
            </Badge>
            <span className="truncate text-sm">{item.title}</span>
          </div>
          <span className="text-muted-foreground shrink-0 text-xs">
            {formatRelativeTime(item.publishedAt)}
          </span>
        </div>
      ))}
    </div>
  )
}
