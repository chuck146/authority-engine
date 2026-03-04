'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ga4DeviceBreakdown } from '@/types/ga4'

type Ga4DeviceBreakdownProps = {
  devices: Ga4DeviceBreakdown[]
}

const DEVICE_LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
}

export function Ga4DeviceBreakdownCards({ devices }: Ga4DeviceBreakdownProps) {
  if (devices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No device data available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {devices.map((d) => (
            <div key={d.deviceCategory} className="rounded-lg border p-4 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                {DEVICE_LABELS[d.deviceCategory] ?? d.deviceCategory}
              </p>
              <p className="mt-1 text-2xl font-bold">{d.percentage}%</p>
              <p className="text-xs text-muted-foreground">
                {d.sessions.toLocaleString()} sessions
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
