'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VideoGenerateForm } from '@/components/video/video-generate-form'
import { VideoLibraryGrid } from '@/components/video/video-library-grid'
import { VideoDetailSheet } from '@/components/video/video-detail-sheet'
import type { VideoLibraryItem } from '@/types/video'

export function VideoPageClient() {
  const [items, setItems] = useState<VideoLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('library')
  const [selectedItem, setSelectedItem] = useState<VideoLibraryItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/v1/video')
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  const handleSelectItem = (item: VideoLibraryItem) => {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/v1/video/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      setSheetOpen(false)
    }
  }

  const handleJobComplete = (item: VideoLibraryItem) => {
    setItems((prev) => [item, ...prev])
    setActiveTab('library')
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library">Library ({items.length})</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="library" className="mt-6">
          <VideoLibraryGrid items={items} loading={loading} onSelectItem={handleSelectItem} />
        </TabsContent>
        <TabsContent value="generate" className="mt-6">
          <VideoGenerateForm onJobComplete={handleJobComplete} />
        </TabsContent>
      </Tabs>

      <VideoDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={handleDelete}
      />
    </>
  )
}
