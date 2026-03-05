'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReviewRequestDetailSheet } from './review-request-detail-sheet'
import type { ReviewRequestListItem } from '@/types/review-requests'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  sent: 'secondary',
  delivered: 'default',
  completed: 'default',
  opened: 'secondary',
  failed: 'destructive',
}

const CHANNEL_LABELS: Record<string, string> = {
  sms: 'SMS',
  email: 'Email',
}

export function ReviewRequestList() {
  const [requests, setRequests] = useState<ReviewRequestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function fetchRequests() {
    fetch('/api/v1/reviews/requests')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load review requests')
        return res.json()
      })
      .then((data) => setRequests(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted h-14 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No review requests yet. Use the form above to create one.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Review Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {requests.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => setSelectedId(req.id)}
                className="hover:bg-muted/50 flex w-full items-center gap-4 px-2 py-3 text-left transition-colors"
              >
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {CHANNEL_LABELS[req.channel] ?? req.channel}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{req.customerName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {req.customerPhone ?? req.customerEmail ?? '(No contact)'}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[req.status] ?? 'outline'}>{req.status}</Badge>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ReviewRequestDetailSheet
        requestId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={fetchRequests}
      />
    </>
  )
}
