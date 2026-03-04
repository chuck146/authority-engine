'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageGenerateForm } from '@/components/media/image-generate-form'
import { MediaLibraryGrid } from '@/components/media/media-library-grid'
import { MediaDetailSheet } from '@/components/media/media-detail-sheet'
import type { MediaLibraryItem, GenerateImageResponse } from '@/types/media'

export function MediaPageClient() {
  const [items, setItems] = useState<MediaLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('library')
  const [selectedItem, setSelectedItem] = useState<MediaLibraryItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await fetch('/api/v1/media')
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchMedia()
  }, [])

  const handleGenerated = (result: GenerateImageResponse) => {
    const newItem: MediaLibraryItem = {
      id: result.id,
      imageType: result.imageType,
      filename: result.filename,
      publicUrl: result.publicUrl,
      mimeType: result.mimeType,
      sizeBytes: result.sizeBytes,
      width: result.width,
      height: result.height,
      altText: result.altText,
      createdAt: new Date().toISOString(),
    }
    setItems((prev) => [newItem, ...prev])
    setActiveTab('library')
  }

  const handleSelectItem = (item: MediaLibraryItem) => {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/v1/media/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      setSheetOpen(false)
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library">Library ({items.length})</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="mt-6">
          <MediaLibraryGrid items={items} loading={loading} onSelectItem={handleSelectItem} />
        </TabsContent>
        <TabsContent value="generate" className="mt-6">
          <ImageGenerateForm onGenerated={handleGenerated} />
        </TabsContent>
      </Tabs>

      <MediaDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={handleDelete}
      />
    </>
  )
}
