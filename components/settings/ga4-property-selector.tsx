'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Ga4Property = {
  propertyId: string
  displayName: string
  accountName: string
}

export function Ga4PropertySelector() {
  const [properties, setProperties] = useState<Ga4Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/v1/integrations/ga4/properties')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load properties')
        return res.json()
      })
      .then((data) => {
        setProperties(data.properties ?? [])
        if (data.properties?.length === 1) {
          setSelected(data.properties[0].propertyId)
        }
      })
      .catch(() => setProperties([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch('/api/v1/integrations/ga4/select-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: selected }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to save property')
        return
      }
      toast.success('GA4 property selected')
    } catch {
      toast.error('Failed to save property')
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

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">No GA4 properties found for this account.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select GA4 Property</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <select
          className="bg-background w-full rounded-md border px-3 py-2 text-sm"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Select a property...</option>
          {properties.map((p) => (
            <option key={p.propertyId} value={p.propertyId}>
              {p.displayName} ({p.accountName})
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
