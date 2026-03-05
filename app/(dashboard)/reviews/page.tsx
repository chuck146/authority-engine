import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { ReviewsPageClient } from '@/components/reviews/reviews-page-client'

export const metadata: Metadata = { title: 'Reviews' }

export default async function ReviewsPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Review Command Center</h1>
        <p className="text-muted-foreground">Monitor and manage reviews across all platforms.</p>
      </div>
      <ReviewsPageClient />
    </div>
  )
}
