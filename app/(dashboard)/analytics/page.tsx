import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { AnalyticsPageClient } from '@/components/analytics/analytics-page-client'

export const metadata: Metadata = { title: 'Analytics & Reporting' }

export default async function AnalyticsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
        <p className="text-muted-foreground">
          Track traffic, keyword rankings, and search performance.
        </p>
      </div>
      <AnalyticsPageClient />
    </div>
  )
}
