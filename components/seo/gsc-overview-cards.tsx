'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GscSummary } from '@/types/gsc'

type GscOverviewCardsProps = {
  summary: GscSummary
}

function TrendIndicator({ value, invertColor }: { value: number; invertColor?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">—</span>
  const isPositive = invertColor ? value < 0 : value > 0
  const color = isPositive ? 'text-green-600' : 'text-red-600'
  const arrow = value > 0 ? '↑' : '↓'
  return (
    <span className={`text-xs ${color}`}>
      {arrow} {Math.abs(value)}%
    </span>
  )
}

export function GscOverviewCards({ summary }: GscOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Total Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{summary.clicks.toLocaleString()}</span>
            <TrendIndicator value={summary.clicksTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Impressions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{summary.impressions.toLocaleString()}</span>
            <TrendIndicator value={summary.impressionsTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Avg CTR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{(summary.ctr * 100).toFixed(1)}%</span>
            <TrendIndicator value={summary.ctrTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">Avg Position</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{summary.position.toFixed(1)}</span>
            <TrendIndicator value={summary.positionTrend} invertColor />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
