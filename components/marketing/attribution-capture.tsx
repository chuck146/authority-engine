'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/analytics/client'

// Records first-touch attribution (landing page, referrer host, UTM tags) once
// per visitor so estimate requests can be credited to the right channel.
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
