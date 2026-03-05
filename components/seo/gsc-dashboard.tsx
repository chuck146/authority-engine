'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { GscConnectionStatus } from './gsc-connection-status'
import { GscOverviewCards } from './gsc-overview-cards'
import { GscTopQueries } from './gsc-top-queries'
import { GscTopPages } from './gsc-top-pages'
import { GscIndexingCoverage } from './gsc-indexing-coverage'
import type { GscOverview } from '@/types/gsc'

export function GscDashboard() {
  const [overview, setOverview] = useState<GscOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/gsc/overview')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load GSC data')
        return res.json()
      })
      .then((data) => setOverview(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

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

  if (error || !overview) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error ?? 'Failed to load GSC data'}</p>
      </div>
    )
  }

  if (!overview.isConnected) {
    return <GscConnectionStatus isConnected={false} siteUrl={null} />
  }

  return (
    <div className="space-y-6">
      <GscConnectionStatus isConnected={true} siteUrl={overview.siteUrl} />
      {overview.summary && <GscOverviewCards summary={overview.summary} />}
      <div className="grid gap-6 lg:grid-cols-2">
        <GscTopQueries queries={overview.topQueries} />
        <GscTopPages pages={overview.topPages} />
      </div>
      <GscIndexingCoverage coverage={overview.indexingCoverage} sitemaps={overview.sitemaps} />
    </div>
  )
}
