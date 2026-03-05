'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Ga4ConnectionStatusProps = {
  isConnected: boolean
  propertyId: string | null
}

export function Ga4ConnectionStatus({ isConnected, propertyId }: Ga4ConnectionStatusProps) {
  if (isConnected) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Badge variant="default" className="bg-green-600">
          Connected
        </Badge>
        {propertyId && <span>{propertyId}</span>}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed p-6 text-center">
      <p className="mb-2 font-medium">Google Analytics not connected</p>
      <p className="text-muted-foreground mb-4 text-sm">
        Connect GA4 in Settings to see page performance, traffic sources, and user behavior.
      </p>
      <Button variant="outline" size="sm" asChild>
        <a href="/settings">Go to Settings</a>
      </Button>
    </div>
  )
}
