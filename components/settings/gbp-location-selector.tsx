'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type GbpLocation = {
  value: string
  label: string
  address?: string
}

export function GbpLocationSelector() {
  const [locations, setLocations] = useState<GbpLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/v1/integrations/gbp/locations')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load locations')
        return res.json()
      })
      .then((data) => {
        setLocations(data.locations ?? [])
        if (data.locations?.length === 1) {
          setSelected(data.locations[0].value)
        }
      })
      .catch(() => setLocations([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/integrations/gbp/select-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: selected }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to save location')
        return
      }
      toast.success('GBP location selected')
    } catch {
      toast.error('Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-muted h-10 animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            No business locations found for this account.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select Business Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <select
          className="bg-background w-full rounded-md border px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select a location...</option>
          {locations.map((loc) => (
            <option key={loc.value} value={loc.value}>
              {loc.label}
              {loc.address ? ` — ${loc.address}` : ''}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={handleSave} disabled={!selected || saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardContent>
    </Card>
  )
}
