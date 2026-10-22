import type { Metadata } from 'next'
import MarketingLayout from '@/app/(marketing)/layout'
import { NotFoundContent } from '@/components/marketing/not-found-content'

// Unmatched URLs render here (outside any route group), so wrap in the
// marketing layout to keep the site header, footer, and navigation.
export const metadata: Metadata = {
  title: { absolute: 'Page Not Found | Cleanest Painting LLC' },
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <MarketingLayout>
      <NotFoundContent />
    </MarketingLayout>
  )
}
