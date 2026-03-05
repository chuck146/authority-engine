'use client'

import { Badge } from '@/components/ui/badge'
import type { ContentPipeline } from '@/types/dashboard'

type ContentPipelineChartProps = {
  pipeline: ContentPipeline
}

const segments = [
  { key: 'published' as const, label: 'Published', color: 'bg-green-500' },
  { key: 'approved' as const, label: 'Approved', color: 'bg-blue-500' },
  { key: 'review' as const, label: 'Review', color: 'bg-yellow-500' },
  { key: 'draft' as const, label: 'Draft', color: 'bg-muted-foreground/40' },
  { key: 'archived' as const, label: 'Archived', color: 'bg-muted-foreground/20' },
]

export function ContentPipelineChart({ pipeline }: ContentPipelineChartProps) {
  const { statusBreakdown, totalContent, byType } = pipeline

  if (totalContent === 0) {
    return <div className="text-muted-foreground text-sm">No content yet.</div>
  }

  return (
    <div className="space-y-4">
      {/* Stacked bar */}
      <div className="bg-muted flex h-4 overflow-hidden rounded-full">
        {segments.map(({ key, color }) => {
          const count = statusBreakdown[key] ?? 0
          const pct = (count / totalContent) * 100
          if (pct === 0) return null
          return (
            <div key={key} className={`${color} transition-all`} style={{ width: `${pct}%` }} />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {segments.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <span className="text-muted-foreground">
              {label}: {statusBreakdown[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Content by type */}
      <div className="grid gap-3 pt-2 md:grid-cols-3">
        {byType.map(({ contentType, label, total, published }) => (
          <div
            key={contentType}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span className="text-sm font-medium">{label}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{total}</Badge>
              <span className="text-muted-foreground text-xs">{published} published</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
