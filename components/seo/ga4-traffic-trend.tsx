'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ga4TrafficTrendPoint } from '@/types/ga4'

type Ga4TrafficTrendProps = {
  data: Ga4TrafficTrendPoint[]
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${width}%` }} />
      </div>
      <span className="w-12 text-right text-xs tabular-nums">{value.toLocaleString()}</span>
    </div>
  )
}

export function Ga4TrafficTrend({ data }: Ga4TrafficTrendProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Trend (28 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No trend data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  const maxSessions = Math.max(...data.map((d) => d.sessions), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Trend (28 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {data.map((d) => (
            <div key={d.date} className="grid grid-cols-[80px_1fr] items-center gap-2">
              <span className="text-muted-foreground text-xs">{d.date.slice(5)}</span>
              <MiniBar value={d.sessions} max={maxSessions} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
