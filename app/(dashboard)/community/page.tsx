import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Community' }

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Community Lead Capture</h1>
        <p className="text-muted-foreground">
          Monitor Facebook groups and capture leads from community engagement.
        </p>
      </div>
    </div>
  )
}
