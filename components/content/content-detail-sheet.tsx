'use client'

import { useState, useEffect } from 'react'
import {
  CheckCircle,
  XCircle,
  Globe,
  Archive,
  CalendarDays,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { ContentPreview } from '@/components/content/content-preview'
import { ScheduleDialog } from '@/components/calendar/schedule-dialog'
import { getAvailableActions } from '@/lib/content/status-transitions'
import type { ContentListItem, ContentDetail, ContentType } from '@/types/content'
import type { ContentStatus, UserRole } from '@/types'

type ContentDetailSheetProps = {
  item: ContentListItem | null
  userRole: UserRole
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (
    id: string,
    type: ContentType,
    action: string,
    rejectionNote?: string,
  ) => Promise<void>
}

const statusVariant: Record<ContentStatus, 'default' | 'secondary' | 'outline'> = {
  draft: 'secondary',
  review: 'outline',
  approved: 'default',
  published: 'default',
  archived: 'secondary',
}

const typeLabels: Record<ContentType, string> = {
  service_page: 'Service Page',
  location_page: 'Location Page',
  blog_post: 'Blog Post',
}

const actionConfig: Record<string, { label: string; icon: typeof CheckCircle; variant: 'default' | 'outline' | 'destructive' }> = {
  approve: { label: 'Approve', icon: CheckCircle, variant: 'default' },
  publish: { label: 'Publish', icon: Globe, variant: 'default' },
  reject: { label: 'Reject', icon: XCircle, variant: 'outline' },
  archive: { label: 'Archive', icon: Archive, variant: 'destructive' },
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

export function ContentDetailSheet({
  item,
  userRole,
  open,
  onOpenChange,
  onStatusChange,
}: ContentDetailSheetProps) {
  const [detail, setDetail] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  useEffect(() => {
    if (!open || !item) {
      setDetail(null)
      setShowRejectForm(false)
      setRejectionNote('')
      return
    }

    async function fetchDetail() {
      setLoading(true)
      try {
        const res = await fetch(`/api/v1/content/${item!.type}/${item!.id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data: ContentDetail = await res.json()
        setDetail(data)
      } catch {
        toast.error('Failed to load content details')
        onOpenChange(false)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [open, item, onOpenChange])

  const handleAction = async (action: string) => {
    if (!item) return

    if (action === 'reject' && !showRejectForm) {
      setShowRejectForm(true)
      return
    }

    setIsSubmitting(true)
    try {
      await onStatusChange(
        item.id,
        item.type,
        action,
        action === 'reject' ? rejectionNote : undefined,
      )
      // Update local detail to reflect new status
      if (detail) {
        const statusMap: Record<string, ContentStatus> = {
          approve: 'approved',
          reject: 'draft',
          publish: 'published',
          archive: 'archived',
        }
        const newStatus = statusMap[action]
        if (newStatus) {
          setDetail({ ...detail, status: newStatus })
        }
      }
      setShowRejectForm(false)
      setRejectionNote('')
      onOpenChange(false)
    } catch {
      // Error toast handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStatus = detail?.status ?? item?.status ?? 'draft'
  const availableActions = getAvailableActions(currentStatus, userRole)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{item?.title ?? 'Content Detail'}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2">
              {item && <Badge variant="secondary">{typeLabels[item.type]}</Badge>}
              <Badge variant={statusVariant[currentStatus]}>{currentStatus}</Badge>
            </div>
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detail ? (
            <>
              <ContentPreview
                content={detail.content}
                title={detail.title}
                contentType={detail.type}
                status={detail.status}
              />

              <Separator className="my-4" />

              <div className="text-muted-foreground space-y-1 text-sm">
                {detail.approvedBy && detail.approvedAt && (
                  <p>Approved {formatDateTime(detail.approvedAt)}</p>
                )}
                {detail.publishedAt && (
                  <p>Published {formatDateTime(detail.publishedAt)}</p>
                )}
                {detail.rejectionNote && (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-red-800">
                    <p className="font-medium">Rejection note:</p>
                    <p>{detail.rejectionNote}</p>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {availableActions.length > 0 && (
          <SheetFooter className="border-t pt-4">
            {showRejectForm ? (
              <div className="w-full space-y-3">
                <Textarea
                  placeholder="Explain why this content needs revision..."
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false)
                      setRejectionNote('')
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={!rejectionNote.trim() || isSubmitting}
                    onClick={() => handleAction('reject')}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full justify-end gap-2">
                {currentStatus === 'approved' && (
                  <Button
                    variant="outline"
                    disabled={isSubmitting || loading}
                    onClick={() => setScheduleOpen(true)}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Schedule
                  </Button>
                )}
                {availableActions.map((action) => {
                  const config = actionConfig[action]
                  if (!config) return null
                  const Icon = config.icon
                  return (
                    <Button
                      key={action}
                      variant={config.variant}
                      disabled={isSubmitting || loading}
                      onClick={() => handleAction(action)}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      {config.label}
                    </Button>
                  )
                })}
              </div>
            )}
          </SheetFooter>
        )}
      </SheetContent>

      {item && (
        <ScheduleDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          defaultContentType={item.type}
          defaultContentId={item.id}
          onScheduled={() => {
            setScheduleOpen(false)
            onOpenChange(false)
          }}
        />
      )}
    </Sheet>
  )
}
