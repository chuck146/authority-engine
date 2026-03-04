'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ga4Summary } from '@/types/ga4'

type Ga4OverviewCardsProps = {
  summary: Ga4Summary
}

function TrendIndicator({ value, invertColor }: { value: number; invertColor?: boolean }) {
  if (value === 0) return <span className="text-xs text-muted-foreground">&mdash;</span>
  const isPositive = invertColor ? value < 0 : value > 0
  const color = isPositive ? 'text-green-600' : 'text-red-600'
  const arrow = value > 0 ? '\u2191' : '\u2193'
  return <span className={`text-xs ${color}`}>{arrow} {Math.abs(value)}%</span>
}

export function Ga4OverviewCards({ summary }: Ga4OverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{summary.sessions.toLocaleString()}</span>
            <TrendIndicator value={summary.sessionsTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{summary.users.toLocaleString()}</span>
            <TrendIndicator value={summary.usersTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pageviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{summary.pageviews.toLocaleString()}</span>
            <TrendIndicator value={summary.pageviewsTrend} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{(summary.bounceRate * 100).toFixed(1)}%</span>
            <TrendIndicator value={summary.bounceRateTrend} invertColor />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
