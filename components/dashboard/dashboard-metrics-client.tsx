'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricsHeroCards } from './metrics-hero-cards'
import { ContentPipelineChart } from './content-pipeline-chart'
import { RecentActivity } from './recent-activity'
import type { DashboardMetrics } from '@/types/dashboard'

export function DashboardMetricsClient() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load dashboard data')
        return res.json()
      })
      .then((data) => setMetrics(data))
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

  if (error || !metrics) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error ?? 'Failed to load dashboard data'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <MetricsHeroCards hero={metrics.hero} />

      <Card>
        <CardHeader>
          <CardTitle>Content Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ContentPipelineChart pipeline={metrics.pipeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity items={metrics.recentActivity} />
        </CardContent>
      </Card>
    </div>
  )
}
