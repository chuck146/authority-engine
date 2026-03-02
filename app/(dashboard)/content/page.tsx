import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Content' }

export default function ContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Engine</h1>
        <p className="text-muted-foreground">
          Generate and manage service pages, location pages, and blog posts.
        </p>
      </div>
    </div>
  )
}
