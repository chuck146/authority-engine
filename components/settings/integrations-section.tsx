'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type ConnectionStatus = {
  isConnected: boolean
  provider: string | null
  siteUrl?: string | null
  propertyId?: string | null
  locationName?: string | null
  connectedAt: string | null
}

type IntegrationRowProps = {
  label: string
  description: string
  statusUrl: string
  disconnectUrl: string
  connectUrl: string
  displayField: 'siteUrl' | 'propertyId' | 'locationName'
}

function IntegrationRow({
  label,
  description,
  statusUrl,
  disconnectUrl,
  connectUrl,
  displayField,
}: IntegrationRowProps) {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetch(statusUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load status')
        return res.json()
      })
      .then((data) => setStatus(data))
      .catch(() => setStatus({ isConnected: false, provider: null, connectedAt: null }))
      .finally(() => setLoading(false))
  }, [statusUrl])

  async function handleConnect() {
    window.location.href = connectUrl
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch(disconnectUrl, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to disconnect')
        return
      }
      setStatus({ isConnected: false, provider: null, connectedAt: null })
      toast.success(`${label} disconnected`)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="bg-muted h-10 w-48 animate-pulse rounded" />
        <div className="bg-muted h-8 w-20 animate-pulse rounded" />
      </div>
    )
  }

  const displayValue =
    displayField === 'propertyId'
      ? status?.propertyId
      : displayField === 'locationName'
        ? status?.locationName
        : status?.siteUrl

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {status?.isConnected ? (
            <Badge variant="default" className="bg-green-600">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
        {status?.isConnected && displayValue && (
          <p className="text-muted-foreground text-sm">{displayValue}</p>
        )}
        {!status?.isConnected && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      <div>
        {status?.isConnected ? (
          <Button variant="outline" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect}>
            Connect
          </Button>
        )}
      </div>
    </div>
  )
}

function SmsStatusRow() {
  const [status, setStatus] = useState<{ isConfigured: boolean; provider: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/integrations/sms/status')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load status')
        return res.json()
      })
      .then((data) => setStatus(data))
      .catch(() => setStatus({ isConfigured: false, provider: 'salesmessage' }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="bg-muted h-10 w-48 animate-pulse rounded" />
        <div className="bg-muted h-8 w-20 animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">SalesMessage (SMS)</span>
          {status?.isConfigured ? (
            <Badge variant="default" className="bg-green-600">
              Configured
            </Badge>
          ) : (
            <Badge variant="secondary">Not Configured</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm">
          {status?.isConfigured
            ? 'SMS review requests via SalesMessage.'
            : 'Set SALESMESSAGE_API_KEY, SALESMESSAGE_NUMBER_ID, and SALESMESSAGE_TEAM_ID in environment.'}
        </p>
      </div>
    </div>
  )
}

export function IntegrationsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect external services to your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <IntegrationRow
          label="Google Search Console"
          description="Connect to track keyword rankings, indexing status, and search performance."
          statusUrl="/api/v1/integrations/google/status"
          disconnectUrl="/api/v1/integrations/google/disconnect"
          connectUrl="/api/auth/google?provider=search_console"
          displayField="siteUrl"
        />
        <IntegrationRow
          label="Google Analytics"
          description="Connect to track page performance, traffic sources, and user behavior."
          statusUrl="/api/v1/integrations/ga4/status"
          disconnectUrl="/api/v1/integrations/ga4/disconnect"
          connectUrl="/api/auth/google?provider=analytics"
          displayField="propertyId"
        />
        <IntegrationRow
          label="Google Business Profile"
          description="Connect to sync reviews and post responses to Google."
          statusUrl="/api/v1/integrations/gbp/status"
          disconnectUrl="/api/v1/integrations/gbp/disconnect"
          connectUrl="/api/auth/google?provider=business_profile"
          displayField="locationName"
        />
        <SmsStatusRow />
      </CardContent>
    </Card>
  )
}
