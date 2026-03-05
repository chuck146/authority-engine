'use client'

import { useState } from 'react'
import { CalendarClock, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { statusLabels, contentTypeFullLabels } from './calendar-constants'
import type { CalendarViewItem, CalendarStatus } from '@/types/calendar'

type CalendarEntrySheetProps = {
  item: CalendarViewItem | null
  userRole: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEntryUpdated: () => void
}

const statusVariant: Record<CalendarStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  scheduled: 'default',
  publishing: 'outline',
  published: 'default',
  failed: 'destructive',
  cancelled: 'secondary',
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function CalendarEntrySheet({
  item,
  userRole,
  open,
  onOpenChange,
  onEntryUpdated,
}: CalendarEntrySheetProps) {
  const [showReschedule, setShowReschedule] = useState(false)
  const [newScheduledAt, setNewScheduledAt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canModify = item?.status === 'scheduled' && ['owner', 'admin', 'editor'].includes(userRole)

  function handleOpenChange(open: boolean) {
    if (!open) {
      setShowReschedule(false)
      setNewScheduledAt('')
    }
    onOpenChange(open)
  }

  async function handleCancel() {
    if (!item) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/calendar/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to cancel')
        return
      }
      toast.success('Scheduled publish cancelled')
      onOpenChange(false)
      onEntryUpdated()
    } catch {
      toast.error('Failed to cancel scheduled publish')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReschedule() {
    if (!item || !newScheduledAt) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/v1/calendar/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date(newScheduledAt).toISOString() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to reschedule')
        return
      }
      toast.success('Content rescheduled')
      onOpenChange(false)
      onEntryUpdated()
    } catch {
      toast.error('Failed to reschedule content')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{item?.contentTitle ?? 'Calendar Entry'}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2">
              {item && <Badge variant="secondary">{contentTypeFullLabels[item.contentType]}</Badge>}
              {item && (
                <Badge variant={statusVariant[item.status]}>{statusLabels[item.status]}</Badge>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {!item ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Scheduled for</span>
                <p className="font-medium">{formatDateTime(item.scheduledAt)}</p>
              </div>

              {item.publishedAt && (
                <div>
                  <span className="text-muted-foreground">Published at</span>
                  <p className="font-medium">{formatDateTime(item.publishedAt)}</p>
                </div>
              )}

              {item.errorMessage && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                  <p className="font-medium">Error</p>
                  <p>{item.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {canModify && (
          <SheetFooter className="border-t pt-4">
            {showReschedule ? (
              <div className="w-full space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="reschedule-at">New Date & Time</Label>
                  <Input
                    id="reschedule-at"
                    type="datetime-local"
                    value={newScheduledAt}
                    onChange={(e) => setNewScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReschedule(false)
                      setNewScheduledAt('')
                    }}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button disabled={!newScheduledAt || isSubmitting} onClick={handleReschedule}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarClock className="h-4 w-4" />
                    )}
                    Confirm Reschedule
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowReschedule(true)}
                >
                  <CalendarClock className="h-4 w-4" />
                  Reschedule
                </Button>
                <Button variant="destructive" disabled={isSubmitting} onClick={handleCancel}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Cancel Publish
                </Button>
              </div>
            )}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
