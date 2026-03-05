import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { SocialPageClient } from '@/components/social/social-page-client'

export const metadata: Metadata = { title: 'Social & GBP' }

export default async function SocialPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social & GBP</h1>
        <p className="text-muted-foreground">
          Generate and manage posts for Google Business Profile, Instagram, and Facebook.
        </p>
      </div>
      <SocialPageClient />
    </div>
  )
}
