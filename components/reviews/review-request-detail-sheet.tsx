'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ReviewRequestDetail } from '@/types/review-requests'

type ReviewRequestDetailSheetProps = {
  requestId: string | null
  onClose: () => void
  onStatusChange?: () => void
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  sent: 'secondary',
  delivered: 'default',
  completed: 'default',
  opened: 'secondary',
  failed: 'destructive',
}

export function ReviewRequestDetailSheet({
  requestId,
  onClose,
  onStatusChange,
}: ReviewRequestDetailSheetProps) {
  const [detail, setDetail] = useState<ReviewRequestDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestId) {
      setDetail(null)
      return
    }

    setLoading(true)
    setSendError(null)

    fetch(`/api/v1/reviews/requests/${requestId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load')
        return res.json()
      })
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [requestId])

  async function handleSend() {
    if (!detail) return
    setSending(true)
    setSendError(null)

    try {
      const res = await fetch(`/api/v1/reviews/requests/${detail.id}/send`, {
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send')
      }

      // Refresh detail
      const refreshRes = await fetch(`/api/v1/reviews/requests/${detail.id}`)
      if (refreshRes.ok) {
        setDetail(await refreshRes.json())
      }
      onStatusChange?.()
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  const canSend = detail && (detail.status === 'pending' || detail.status === 'failed')

  return (
    <Sheet open={!!requestId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{detail?.customerName ?? 'Review Request'}</SheetTitle>
          <SheetDescription>Review request details</SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="space-y-3 pt-4">
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="bg-muted h-20 animate-pulse rounded" />
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-4 pt-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Status:</span>
              <Badge variant={STATUS_VARIANTS[detail.status] ?? 'outline'}>
                {detail.status}
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Contact</h4>
              {detail.customerPhone && (
                <p className="text-sm">Phone: {detail.customerPhone}</p>
              )}
              {detail.customerEmail && (
                <p className="text-sm">Email: {detail.customerEmail}</p>
              )}
              <p className="text-muted-foreground text-sm">
                Channel: {detail.channel.toUpperCase()}
              </p>
            </div>

            {/* Review URL */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Review URL</h4>
              <a
                href={detail.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline break-all dark:text-blue-400"
              >
                {detail.reviewUrl}
              </a>
            </div>

            {/* Timestamps */}
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Created:</span>{' '}
                {new Date(detail.createdAt).toLocaleString()}
              </p>
              {detail.sentAt && (
                <p>
                  <span className="text-muted-foreground">Sent:</span>{' '}
                  {new Date(detail.sentAt).toLocaleString()}
                </p>
              )}
              {detail.deliveredAt && (
                <p>
                  <span className="text-muted-foreground">Delivered:</span>{' '}
                  {new Date(detail.deliveredAt).toLocaleString()}
                </p>
              )}
              {detail.completedAt && (
                <p>
                  <span className="text-muted-foreground">Completed:</span>{' '}
                  {new Date(detail.completedAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Error */}
            {detail.errorMessage && (
              <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                {detail.errorMessage}
              </div>
            )}

            {/* Send Error */}
            {sendError && (
              <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
                {sendError}
              </div>
            )}

            {/* Actions */}
            {canSend && (
              <Button onClick={handleSend} disabled={sending}>
                {sending
                  ? 'Sending...'
                  : detail.status === 'failed'
                    ? 'Resend SMS'
                    : 'Send SMS'}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
