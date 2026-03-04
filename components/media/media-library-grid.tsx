'use client'

import { ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MediaLibraryItem } from '@/types/media'

const IMAGE_TYPE_LABELS: Record<string, string> = {
  blog_thumbnail: 'Blog Thumbnail',
  location_hero: 'Location Hero',
  social_graphic: 'Social Graphic',
}

type MediaLibraryGridProps = {
  items: MediaLibraryItem[]
  loading: boolean
  onSelectItem: (item: MediaLibraryItem) => void
}

export function MediaLibraryGrid({ items, loading, onSelectItem }: MediaLibraryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-0">
              <div className="bg-muted aspect-video rounded-t-lg" />
              <div className="space-y-2 p-3">
                <div className="bg-muted h-4 w-3/4 rounded" />
                <div className="bg-muted h-3 w-1/2 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ImageIcon className="text-muted-foreground mb-4 h-12 w-12" />
        <h3 className="text-lg font-semibold">No images yet</h3>
        <p className="text-muted-foreground text-sm">
          Generate your first image using the Generate tab.
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.publicUrl}
              alt={item.altText ?? item.filename}
              className="aspect-video w-full rounded-t-lg object-cover"
            />
            <div className="space-y-1.5 p-3">
              <p className="truncate text-sm font-medium">{item.filename}</p>
              <div className="flex items-center gap-2">
                {item.imageType && (
                  <Badge variant="secondary" className="text-xs">
                    {IMAGE_TYPE_LABELS[item.imageType] ?? item.imageType}
                  </Badge>
                )}
                {item.sizeBytes && (
                  <span className="text-muted-foreground text-xs">
                    {(item.sizeBytes / 1024).toFixed(0)} KB
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
