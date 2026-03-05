'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SeoOverviewCards } from './seo-overview-cards'
import { SeoDistributionChart } from './seo-distribution-chart'
import { SeoContentList } from './seo-content-list'
import { SeoDetailPanel } from './seo-detail-panel'
import { GscDashboard } from './gsc-dashboard'
import { Ga4Dashboard } from './ga4-dashboard'
import type { SeoOverview, SeoContentItem } from '@/types/seo'

function OnPageSeoTab() {
  const [overview, setOverview] = useState<SeoOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<SeoContentItem | null>(null)

  useEffect(() => {
    fetch('/api/v1/seo')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load SEO data')
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
        <p className="text-destructive">{error ?? 'Failed to load SEO data'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SeoOverviewCards overview={overview} />

      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoDistributionChart
            distribution={overview.scoreDistribution}
            total={overview.totalPages}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Pages</CardTitle>
        </CardHeader>
        <CardContent>
          <SeoContentList items={overview.recentScores} onSelectItem={setSelectedItem} />
        </CardContent>
      </Card>

      <SeoDetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  )
}

export function SeoPageClient() {
  return (
    <Tabs defaultValue="on-page">
      <TabsList>
        <TabsTrigger value="on-page">On-Page SEO</TabsTrigger>
        <TabsTrigger value="search-console">Search Console</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
      </TabsList>
      <TabsContent value="on-page">
        <OnPageSeoTab />
      </TabsContent>
      <TabsContent value="search-console">
        <GscDashboard />
      </TabsContent>
      <TabsContent value="analytics">
        <Ga4Dashboard />
      </TabsContent>
    </Tabs>
  )
}
