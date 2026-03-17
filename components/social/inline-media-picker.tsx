'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, X, RefreshCw } from 'lucide-react'

type MediaItem = {
  id: string
  publicUrl: string
  filename: string
}

type InlineMediaPickerProps = {
  currentMediaUrl: string | null
  onSelect: (mediaAssetId: string, mediaUrl: string) => void
  onRemove: () => void
}

export function InlineMediaPicker({ currentMediaUrl, onSelect, onRemove }: InlineMediaPickerProps) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  async function fetchMedia() {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/media')
      if (!res.ok) throw new Error('Failed to load media')
      const data = await res.json()
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function handleExpand() {
    setExpanded(true)
    fetchMedia()
  }

  function handleSelect(item: MediaItem) {
    onSelect(item.id, item.publicUrl)
    setExpanded(false)
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">Image</h4>

      {currentMediaUrl ? (
        <div className="flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentMediaUrl}
            alt="Attached"
            className="h-16 w-16 rounded border object-cover"
          />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleExpand}>
              <RefreshCw className="mr-1 h-3 w-3" />
              Change
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onRemove}>
              <X className="mr-1 h-3 w-3" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={handleExpand}>
          <ImageIcon className="mr-1 h-3 w-3" />
          Attach Image
        </Button>
      )}

      {expanded && (
        <div className="mt-3 rounded-lg border p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">Select from media library</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setExpanded(false)}
            >
              Cancel
            </Button>
          </div>

          {loading && (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-muted aspect-square animate-pulse rounded" />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-xs">
              No images in library. Generate images from the Media page first.
            </p>
          )}

          {!loading && items.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="hover:ring-primary aspect-square overflow-hidden rounded border transition-all hover:ring-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.publicUrl}
                    alt={item.filename}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
