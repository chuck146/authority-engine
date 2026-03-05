'use client'

import { Copy, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { MediaLibraryItem } from '@/types/media'

const IMAGE_TYPE_LABELS: Record<string, string> = {
  blog_thumbnail: 'Blog Thumbnail',
  location_hero: 'Location Hero',
  social_graphic: 'Social Graphic',
}

type MediaDetailSheetProps = {
  item: MediaLibraryItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: string) => void
}

export function MediaDetailSheet({ item, open, onOpenChange, onDelete }: MediaDetailSheetProps) {
  if (!item) return null

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(item.publicUrl)
    toast.success('URL copied to clipboard')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="truncate">{item.filename}</SheetTitle>
          <SheetDescription>
            {item.imageType && (IMAGE_TYPE_LABELS[item.imageType] ?? item.imageType)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.publicUrl}
            alt={item.altText ?? item.filename}
            className="w-full rounded-lg"
          />

          {item.altText && (
            <div>
              <p className="text-sm font-medium">Alt Text</p>
              <p className="text-muted-foreground text-sm">{item.altText}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Type</p>
              <p className="text-muted-foreground">{item.mimeType}</p>
            </div>
            {item.sizeBytes && (
              <div>
                <p className="font-medium">Size</p>
                <p className="text-muted-foreground">{(item.sizeBytes / 1024).toFixed(0)} KB</p>
              </div>
            )}
            {item.width && item.height && (
              <div>
                <p className="font-medium">Dimensions</p>
                <p className="text-muted-foreground">
                  {item.width} x {item.height}
                </p>
              </div>
            )}
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {item.imageType && <Badge variant="outline">{IMAGE_TYPE_LABELS[item.imageType]}</Badge>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleCopyUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </Button>
            <Button variant="destructive" className="flex-1" onClick={() => onDelete(item.id)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
