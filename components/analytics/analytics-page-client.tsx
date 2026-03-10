'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DateRangePicker } from './date-range-picker'
import { KeywordRankingsTable } from './keyword-rankings-table'
import { ContentPerformanceTable } from './content-performance-table'
import { Ga4OverviewCards } from '@/components/seo/ga4-overview-cards'
import { GscTopQueries } from '@/components/seo/gsc-top-queries'
import { GscTopPages } from '@/components/seo/gsc-top-pages'
import { GscIndexingCoverage } from '@/components/seo/gsc-indexing-coverage'
import { toast } from 'sonner'
import type { AnalyticsOverview } from '@/types/analytics'
import type { Ga4Summary } from '@/types/ga4'
import type { GscSummary, KeywordRankingItem } from '@/types/gsc'

function TrendIndicator({ value, invertColor }: { value: number; invertColor?: boolean }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">&mdash;</span>
  const isPositive = invertColor ? value < 0 : value > 0
  const color = isPositive ? 'text-green-600' : 'text-red-600'
  const arrow = value > 0 ? '↑' : '↓'
  return (
    <span className={`text-xs ${color}`}>
      {arrow} {Math.abs(value)}%
    </span>
  )
}

function NoDataSyncCard({
  label,
  syncUrl,
  onSynced,
}: {
  label: string
  syncUrl: string
  onSynced: () => void
}) {
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch(syncUrl, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? 'Sync failed')
        return
      }
      toast.success(`${label} synced successfully`)
      onSynced()
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        <p className="text-muted-foreground">
          {label} connected but no data available yet. Click below to sync now, or data will sync
          automatically on a daily schedule.
        </p>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing...' : `Sync ${label}`}
        </Button>
      </CardContent>
    </Card>
  )
}

function OverviewTab() {
  const searchParams = useSearchParams()
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const range = searchParams.get('range') ?? '28d'
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ range })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    fetch(`/api/v1/analytics/overview?${params}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'Failed to load analytics')
        }
        return res.json()
      })
      .then((data) => setOverview(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [range, startDate, endDate])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="bg-muted h-8 w-16 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!overview) return null

  return (
    <div className="space-y-6">
      {/* GA4 Cards */}
      {overview.ga4 && <Ga4OverviewCards summary={overview.ga4 as Ga4Summary} />}

      {/* GSC Cards */}
      {overview.gsc && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Search Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {(overview.gsc as GscSummary).clicks.toLocaleString()}
                </span>
                <TrendIndicator value={(overview.gsc as GscSummary).clicksTrend} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Impressions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {(overview.gsc as GscSummary).impressions.toLocaleString()}
                </span>
                <TrendIndicator value={(overview.gsc as GscSummary).impressionsTrend} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">Avg CTR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {((overview.gsc as GscSummary).ctr * 100).toFixed(1)}%
                </span>
                <TrendIndicator value={(overview.gsc as GscSummary).ctrTrend} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Avg Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">
                  {(overview.gsc as GscSummary).position.toFixed(1)}
                </span>
                <TrendIndicator value={(overview.gsc as GscSummary).positionTrend} invertColor />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Keyword Summary */}
      {overview.keywords.totalTracked > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Keywords Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{overview.keywords.totalTracked}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Avg Keyword Position
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{overview.keywords.avgPosition.toFixed(1)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Top Movers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overview.keywords.topMovers.length === 0 ? (
                <span className="text-muted-foreground text-sm">No changes</span>
              ) : (
                <ul className="space-y-1">
                  {overview.keywords.topMovers.slice(0, 3).map((m) => (
                    <li key={m.query} className="flex items-center justify-between text-sm">
                      <span className="truncate">{m.query}</span>
                      <span
                        className={`ml-2 shrink-0 ${m.change > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {m.change > 0 ? '↑' : '↓'}
                        {Math.abs(m.change).toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!overview.ga4Connected && !overview.gscConnected && overview.keywords.totalTracked === 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-center">
          <p className="text-amber-800">
            No analytics integrations connected. Go to{' '}
            <a href="/settings" className="font-medium underline">
              Settings
            </a>{' '}
            to connect Google Analytics and Search Console.
          </p>
        </div>
      )}

      {overview.ga4Connected && !overview.ga4 && (
        <NoDataSyncCard
          label="Google Analytics"
          syncUrl="/api/v1/integrations/ga4/sync"
          onSynced={() => {
            const params = new URLSearchParams({ range })
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)
            fetch(`/api/v1/analytics/overview?${params}`)
              .then((res) => res.json())
              .then((data) => setOverview(data))
          }}
        />
      )}

      {overview.gscConnected && !overview.gsc && (
        <NoDataSyncCard
          label="Google Search Console"
          syncUrl="/api/v1/integrations/gsc/sync"
          onSynced={() => {
            const params = new URLSearchParams({ range })
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)
            fetch(`/api/v1/analytics/overview?${params}`)
              .then((res) => res.json())
              .then((data) => setOverview(data))
          }}
        />
      )}
    </div>
  )
}

function SearchPerformanceTab() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<{
    topQueries: KeywordRankingItem[]
    topPages: { page: string; clicks: number; impressions: number; ctr: number; position: number }[]
    sitemaps: never[]
    indexingCoverage: { valid: number; warnings: number; errors: number; excluded: number } | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const range = searchParams.get('range') ?? '28d'

  useEffect(() => {
    setLoading(true)
    setError(null)

    fetch('/api/v1/gsc/overview')
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? 'Failed to load GSC data')
        }
        return res.json()
      })
      .then((d) => setData(d))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [range])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="bg-muted h-20 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (!data || !data.topQueries) {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-6 text-center">
        <p className="text-amber-800">
          Google Search Console not connected.{' '}
          <a href="/settings" className="font-medium underline">
            Connect in Settings
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GscTopQueries queries={data.topQueries} />
      <GscTopPages pages={data.topPages} />
      {data.indexingCoverage && data.sitemaps && (
        <GscIndexingCoverage coverage={data.indexingCoverage} sitemaps={data.sitemaps} />
      )}
    </div>
  )
}

function AnalyticsPageInner() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="search-performance">Search Performance</TabsTrigger>
          <TabsTrigger value="content-performance">Content Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="keywords">
          <KeywordRankingsTable />
        </TabsContent>
        <TabsContent value="search-performance">
          <SearchPerformanceTab />
        </TabsContent>
        <TabsContent value="content-performance">
          <ContentPerformanceTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function AnalyticsPageClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="bg-muted h-10 w-48 animate-pulse rounded" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="bg-muted h-8 w-16 animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      }
    >
      <AnalyticsPageInner />
    </Suspense>
  )
}
