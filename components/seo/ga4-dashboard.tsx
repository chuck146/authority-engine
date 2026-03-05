'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Ga4ConnectionStatus } from './ga4-connection-status'
import { Ga4OverviewCards } from './ga4-overview-cards'
import { Ga4TrafficTrend } from './ga4-traffic-trend'
import { Ga4TopPages } from './ga4-top-pages'
import { Ga4TrafficSources } from './ga4-traffic-sources'
import { Ga4DeviceBreakdownCards } from './ga4-device-breakdown'
import type { Ga4Overview } from '@/types/ga4'

export function Ga4Dashboard() {
  const [overview, setOverview] = useState<Ga4Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/ga4/overview')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load GA4 data')
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
        <p className="text-destructive">{error ?? 'Failed to load GA4 data'}</p>
      </div>
    )
  }

  if (!overview.isConnected) {
    return <Ga4ConnectionStatus isConnected={false} propertyId={null} />
  }

  return (
    <div className="space-y-6">
      <Ga4ConnectionStatus isConnected={true} propertyId={overview.propertyId} />
      {overview.summary && <Ga4OverviewCards summary={overview.summary} />}
      <Ga4TrafficTrend data={overview.dailyTrend} />
      <Ga4TopPages pages={overview.topPages} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Ga4TrafficSources sources={overview.trafficSources} />
        <Ga4DeviceBreakdownCards devices={overview.deviceBreakdown} />
      </div>
    </div>
  )
}
