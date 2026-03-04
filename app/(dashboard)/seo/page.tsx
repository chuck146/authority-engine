import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { SeoPageClient } from '@/components/seo/seo-page-client'

export const metadata: Metadata = { title: 'SEO Command Center' }

export default async function SeoPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Command Center</h1>
        <p className="text-muted-foreground">
          Monitor SEO health scores and get actionable recommendations.
        </p>
      </div>
      <SeoPageClient />
    </div>
  )
}
