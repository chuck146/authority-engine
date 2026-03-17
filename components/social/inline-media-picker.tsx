'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImageIcon, X, RefreshCw, Upload, Loader2 } from 'lucide-react'

type MediaItem = {
  id: string
  publicUrl: string
  filename: string
}

type InlineMediaPickerProps = {
  currentMediaUrl: string | null
  onSelect: (mediaAssetId: string, mediaUrl: string) => void
  onRemove: () => void
  imageTypeFilter?: string
  onUpload?: (file: File) => Promise<void>
}

export function InlineMediaPicker({
  currentMediaUrl,
  onSelect,
  onRemove,
  imageTypeFilter,
  onUpload,
}: InlineMediaPickerProps) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function fetchMedia() {
    setLoading(true)
    try {
      const url = imageTypeFilter ? `/api/v1/media?imageType=${imageTypeFilter}` : '/api/v1/media'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load media')
      const data = await res.json()
      setItems(data.items ?? data)
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
          {onUpload && (
            <div className="mb-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploading(true)
                  try {
                    await onUpload(file)
                    setExpanded(false)
                  } finally {
                    setUploading(false)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-3 w-3" />
                )}
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          )}

          <div className="mb-2 flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {onUpload ? 'Or select from media library' : 'Select from media library'}
            </p>
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
