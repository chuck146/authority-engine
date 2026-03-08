'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { KeywordTrendPoint } from '@/types/analytics'

type KeywordTrendDetailProps = {
  query: string | null
  onClose: () => void
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

export function KeywordTrendDetail({ query, onClose }: KeywordTrendDetailProps) {
  const searchParams = useSearchParams()
  const [trend, setTrend] = useState<KeywordTrendPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const range = searchParams.get('range') ?? '28d'
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''

  useEffect(() => {
    if (!query) return

    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ range })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    fetch(`/api/v1/analytics/keywords/${encodeURIComponent(query)}/trend?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'Failed to load trend data')
        }
        return res.json()
      })
      .then((data) => setTrend(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [query, range, startDate, endDate])

  const maxClicks = Math.max(...trend.map((t) => t.clicks), 1)

  // Position stats
  const positions = trend.map((t) => t.position)
  const bestPosition = positions.length > 0 ? Math.min(...positions) : 0
  const latestPosition = positions.length > 0 ? positions[positions.length - 1]! : 0
  const totalClicks = trend.reduce((s, t) => s + t.clicks, 0)
  const totalImpressions = trend.reduce((s, t) => s + t.impressions, 0)

  return (
    <Sheet open={query !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className="break-words">&ldquo;{query}&rdquo;</SheetTitle>
          <SheetDescription>Keyword performance over selected period</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-8 animate-pulse rounded" />
              ))}
            </div>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          {!loading && !error && trend.length === 0 && (
            <p className="text-muted-foreground text-sm">No trend data available.</p>
          )}

          {!loading && !error && trend.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      Best Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{bestPosition.toFixed(1)}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      Latest Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{latestPosition.toFixed(1)}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      Total Clicks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{totalClicks.toLocaleString()}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">
                      Total Impressions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-2xl font-bold">{totalImpressions.toLocaleString()}</span>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Position Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {trend.map((t) => (
                      <div
                        key={t.date}
                        className="grid grid-cols-[80px_40px_1fr] items-center gap-2"
                      >
                        <span className="text-muted-foreground text-xs">{t.date.slice(5)}</span>
                        <span className="text-xs font-medium tabular-nums">
                          #{t.position.toFixed(0)}
                        </span>
                        <MiniBar value={t.clicks} max={maxClicks} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
