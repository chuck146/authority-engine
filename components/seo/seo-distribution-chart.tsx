'use client'

import type { SeoScoreDistribution } from '@/types/seo'

type SeoDistributionChartProps = {
  distribution: SeoScoreDistribution
  total: number
}

const segments = [
  { key: 'excellent' as const, label: 'Excellent (80-100)', color: 'bg-green-500' },
  { key: 'good' as const, label: 'Good (60-79)', color: 'bg-yellow-500' },
  { key: 'needsWork' as const, label: 'Needs Work (40-59)', color: 'bg-orange-500' },
  { key: 'poor' as const, label: 'Poor (0-39)', color: 'bg-red-500' },
]

export function SeoDistributionChart({ distribution, total }: SeoDistributionChartProps) {
  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground">No pages to display.</div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        {segments.map(({ key, color }) => {
          const pct = (distribution[key] / total) * 100
          if (pct === 0) return null
          return (
            <div
              key={key}
              className={`${color} transition-all`}
              style={{ width: `${pct}%` }}
            />
          )
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {segments.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <span className="text-muted-foreground">
              {label}: {distribution[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
