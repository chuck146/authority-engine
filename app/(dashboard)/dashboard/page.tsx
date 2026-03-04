import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { DashboardMetricsClient } from '@/components/dashboard/dashboard-metrics-client'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function DashboardPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your SEO &amp; content performance.</p>
      </div>
      <DashboardMetricsClient />
    </div>
  )
}
