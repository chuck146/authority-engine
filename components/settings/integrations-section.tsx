'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type ConnectionStatus = {
  isConnected: boolean
  provider: string | null
  siteUrl: string | null
  connectedAt: string | null
}

export function IntegrationsSection() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    fetch('/api/v1/integrations/google/status')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load integration status')
        return res.json()
      })
      .then((data) => setStatus(data))
      .catch(() => setStatus({ isConnected: false, provider: null, siteUrl: null, connectedAt: null }))
      .finally(() => setLoading(false))
  }, [])

  async function handleConnect() {
    try {
      const res = await fetch('/api/auth/google')
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to start Google connection')
        return
      }
      const { url } = await res.json()
      window.location.href = url
    } catch {
      toast.error('Failed to start Google connection')
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/v1/integrations/google/disconnect', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to disconnect')
        return
      }
      setStatus({ isConnected: false, provider: null, siteUrl: null, connectedAt: null })
      toast.success('Google Search Console disconnected')
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect external services to your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>Connect external services to your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Google Search Console</span>
              {status?.isConnected ? (
                <Badge variant="default" className="bg-green-600">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </div>
            {status?.isConnected && status.siteUrl && (
              <p className="text-sm text-muted-foreground">{status.siteUrl}</p>
            )}
            {!status?.isConnected && (
              <p className="text-sm text-muted-foreground">
                Connect to track keyword rankings, indexing status, and search performance.
              </p>
            )}
          </div>
          <div>
            {status?.isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            ) : (
              <Button size="sm" onClick={handleConnect}>
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
