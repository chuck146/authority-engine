'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Download, CalendarClock } from 'lucide-react'
import { VIDEO_TYPE_LABELS } from './video-generate-form'
import type { VideoLibraryItem } from '@/types/video'

type VideoDetailSheetProps = {
  item: VideoLibraryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
  onSchedule?: (item: VideoLibraryItem) => void
}

export function VideoDetailSheet({ item, open, onOpenChange, onDelete, onSchedule }: VideoDetailSheetProps) {
  if (!item) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="truncate">{item.filename}</SheetTitle>
          <SheetDescription>Video details and actions</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="bg-muted overflow-hidden rounded-lg">
            <video src={item.publicUrl} controls className="w-full" preload="metadata" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {item.engine && (
                <Badge variant={item.engine === 'remotion' ? 'default' : 'secondary'}>
                  {item.engine === 'remotion' ? 'Remotion' : 'Veo 3.1'}
                </Badge>
              )}
              {item.videoType && (
                <Badge variant="outline">
                  {VIDEO_TYPE_LABELS[item.videoType] ?? item.videoType}
                </Badge>
              )}
              {item.durationSeconds && <Badge variant="secondary">{item.durationSeconds}s</Badge>}
            </div>

            <dl className="text-sm">
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Format</dt>
                <dd>{item.mimeType}</dd>
              </div>
              {item.engine && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Engine</dt>
                  <dd>
                    {item.engine === 'remotion'
                      ? 'Remotion (Motion Graphics)'
                      : 'Veo 3.1 (Cinematic AI)'}
                  </dd>
                </div>
              )}
              {item.sizeBytes && (
                <div className="flex justify-between py-1">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd>{(item.sizeBytes / 1024 / 1024).toFixed(2)} MB</dd>
                </div>
              )}
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(item.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild className="flex-1">
              <a href={item.publicUrl} download={item.filename} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Download
              </a>
            </Button>
            {onSchedule && (
              <Button
                variant="outline"
                size="icon"
                aria-label="Schedule video"
                onClick={() => onSchedule(item)}
              >
                <CalendarClock className="h-4 w-4" />
              </Button>
            )}
            <Button variant="destructive" size="icon" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
