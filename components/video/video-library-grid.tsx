'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Video } from 'lucide-react'
import type { VideoLibraryItem, VideoType } from '@/types/video'

type VideoLibraryGridProps = {
  items: VideoLibraryItem[]
  loading: boolean
  onSelectItem: (item: VideoLibraryItem) => void
}

const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  cinematic_reel: 'Cinematic Reel',
  project_showcase: 'Project Showcase',
  testimonial_scene: 'Testimonial',
  brand_story: 'Brand Story',
}

export function VideoLibraryGrid({ items, loading, onSelectItem }: VideoLibraryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted aspect-video animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Video className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">No videos yet</h3>
        <p className="text-muted-foreground text-sm">
          Generate your first AI video using the Generate tab.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.id}
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => onSelectItem(item)}
        >
          <CardContent className="p-0">
            <div className="bg-muted relative aspect-video overflow-hidden rounded-t-lg">
              <video
                src={item.publicUrl}
                className="h-full w-full object-cover"
                muted
                preload="metadata"
              />
              {item.durationSeconds && (
                <Badge variant="secondary" className="absolute right-2 bottom-2 text-xs">
                  {item.durationSeconds}s
                </Badge>
              )}
            </div>
            <div className="p-3">
              <p className="truncate text-sm font-medium">{item.filename}</p>
              <div className="mt-1 flex items-center gap-2">
                {item.videoType && (
                  <Badge variant="outline" className="text-xs">
                    {VIDEO_TYPE_LABELS[item.videoType] ?? item.videoType}
                  </Badge>
                )}
                {item.sizeBytes && (
                  <span className="text-muted-foreground text-xs">
                    {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
