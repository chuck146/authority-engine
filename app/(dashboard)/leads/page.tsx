import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { LeadsPageClient } from '@/components/leads/leads-page-client'

export const metadata: Metadata = { title: 'Leads' }

export default async function LeadsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Manage estimate requests and track your sales pipeline.
        </p>
      </div>
      <LeadsPageClient />
    </div>
  )
}
