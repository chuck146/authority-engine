'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LeadOverview } from '@/types/leads'

type LeadOverviewCardsProps = {
  refreshKey?: number
}

export function LeadOverviewCards({ refreshKey }: LeadOverviewCardsProps) {
  const [data, setData] = useState<LeadOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch_() {
      setLoading(true)
      try {
        const res = await fetch('/api/v1/leads/overview')
        if (res.ok) {
          setData(await res.json())
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetch_()
  }, [refreshKey])

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading overview...</p>
  }

  if (!data) {
    return <p className="text-muted-foreground text-sm">Failed to load overview.</p>
  }

  const funnelStages = [
    { label: 'New', count: data.byStatus.new, color: 'bg-blue-500' },
    { label: 'Contacted', count: data.byStatus.contacted, color: 'bg-amber-500' },
    { label: 'Qualified', count: data.byStatus.qualified, color: 'bg-purple-500' },
    { label: 'Proposed', count: data.byStatus.proposed, color: 'bg-indigo-500' },
    { label: 'Won', count: data.byStatus.won, color: 'bg-green-500' },
  ]

  const funnelTotal = funnelStages.reduce((sum, s) => sum + s.count, 0) || 1

  return (
    <div className="space-y-6">
      {/* Hero cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              New This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.newThisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">In Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.inPipeline}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{(data.conversionRate * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-6 w-full overflow-hidden rounded-full">
            {funnelStages.map((stage) => (
              <div
                key={stage.label}
                className={`${stage.color} flex items-center justify-center text-[10px] font-medium text-white`}
                style={{ width: `${(stage.count / funnelTotal) * 100}%` }}
                title={`${stage.label}: ${stage.count}`}
              >
                {stage.count > 0 && stage.count}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-3">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-1 text-xs">
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-muted-foreground">
                  {stage.label}: {stage.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bySource.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data</p>
            ) : (
              <div className="space-y-2">
                {data.bySource.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{s.source}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Services Requested</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topServices.length === 0 ? (
              <p className="text-muted-foreground text-sm">No data</p>
            ) : (
              <div className="space-y-2">
                {data.topServices.slice(0, 5).map((s) => (
                  <div key={s.service} className="flex items-center justify-between text-sm">
                    <span>{s.service}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Avg response time */}
      {data.avgResponseTimeHours !== null && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-normal">
              Avg. Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {data.avgResponseTimeHours < 1
                ? `${Math.round(data.avgResponseTimeHours * 60)}m`
                : `${data.avgResponseTimeHours.toFixed(1)}h`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
