import type { Metadata } from 'next'
import { NotFoundContent } from '@/components/marketing/not-found-content'

export const metadata: Metadata = {
  title: { absolute: 'Page Not Found | Cleanest Painting LLC' },
  robots: { index: false, follow: true },
}

export default function MarketingNotFound() {
  return <NotFoundContent />
}
