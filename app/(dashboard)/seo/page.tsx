import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'SEO' }

export default function SeoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SEO Command Center</h1>
        <p className="text-muted-foreground">Monitor SEO health and keyword rankings.</p>
      </div>
    </div>
  )
}
