'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { ContentType } from '@/types/content'

type ScheduleDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduled?: () => void
  defaultContentType?: ContentType
  defaultContentId?: string
}

type ApprovedContent = {
  id: string
  title: string
}

export function ScheduleDialog({
  open,
  onOpenChange,
  onScheduled,
  defaultContentType,
  defaultContentId,
}: ScheduleDialogProps) {
  const [contentType, setContentType] = useState<ContentType | ''>(defaultContentType ?? '')
  const [contentId, setContentId] = useState(defaultContentId ?? '')
  const [scheduledAt, setScheduledAt] = useState('')
  const [loading, setLoading] = useState(false)
  const [approvedContent, setApprovedContent] = useState<ApprovedContent[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  async function fetchApprovedContent(type: ContentType) {
    setLoadingContent(true)
    try {
      const tableMap: Record<ContentType, string> = {
        service_page: 'service_pages',
        location_page: 'location_pages',
        blog_post: 'blog_posts',
      }
      const res = await fetch(
        `/api/v1/content/${type}/approved?table=${tableMap[type]}`,
      )
      if (res.ok) {
        const data = await res.json()
        setApprovedContent(data)
      }
    } catch {
      // Silently fail — user can still enter ID manually
    } finally {
      setLoadingContent(false)
    }
  }

  function handleContentTypeChange(value: string) {
    const type = value as ContentType
    setContentType(type)
    setContentId('')
    setApprovedContent([])
    fetchApprovedContent(type)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contentType || !contentId || !scheduledAt) return

    setLoading(true)
    try {
      const res = await fetch('/api/v1/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          contentId,
          scheduledAt: new Date(scheduledAt).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to schedule')
        return
      }

      toast.success('Content scheduled for publishing')
      onOpenChange(false)
      onScheduled?.()
    } catch {
      toast.error('Failed to schedule content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Content</DialogTitle>
          <DialogDescription>
            Choose approved content and a publish date/time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select
              value={contentType}
              onValueChange={handleContentTypeChange}
              disabled={!!defaultContentType}
            >
              <SelectTrigger id="content-type">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="service_page">Service Page</SelectItem>
                <SelectItem value="location_page">Location Page</SelectItem>
                <SelectItem value="blog_post">Blog Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-id">Content</Label>
            {approvedContent.length > 0 ? (
              <Select
                value={contentId}
                onValueChange={setContentId}
                disabled={!!defaultContentId}
              >
                <SelectTrigger id="content-id">
                  <SelectValue placeholder={loadingContent ? 'Loading...' : 'Select content'} />
                </SelectTrigger>
                <SelectContent>
                  {approvedContent.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="content-id"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                placeholder={contentType ? 'No approved content found' : 'Select type first'}
                disabled={!contentType || !!defaultContentId}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled-at">Publish Date & Time</Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !contentType || !contentId || !scheduledAt}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
