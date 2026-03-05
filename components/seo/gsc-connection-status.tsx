'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type GscConnectionStatusProps = {
  isConnected: boolean
  siteUrl: string | null
}

export function GscConnectionStatus({ isConnected, siteUrl }: GscConnectionStatusProps) {
  if (isConnected) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Badge variant="default" className="bg-green-600">
          Connected
        </Badge>
        {siteUrl && <span>{siteUrl}</span>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <p className="mb-2 font-medium">Google Search Console not connected</p>
      <p className="text-muted-foreground mb-4 text-sm">
        Connect GSC in Settings to see keyword rankings, indexing status, and search performance.
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href="/settings">Go to Settings</a>
      </Button>
    </div>
  )
}
