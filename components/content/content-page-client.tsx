'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContentTable } from '@/components/content/content-table'
import { ContentGenerateForm } from '@/components/content/content-generate-form'
import { ContentDetailSheet } from '@/components/content/content-detail-sheet'
import type { ContentListItem, ContentType } from '@/types/content'
import type { ContentStatus, UserRole } from '@/types'

type ContentPageClientProps = {
  initialContent: ContentListItem[]
  userRole: UserRole
}

export function ContentPageClient({ initialContent, userRole }: ContentPageClientProps) {
  const [content, setContent] = useState<ContentListItem[]>(initialContent)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedItem, setSelectedItem] = useState<ContentListItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleGenerated = (item: ContentListItem) => {
    setContent((prev) => [item, ...prev])
    setActiveTab('all')
  }

  const handleSelectItem = (item: ContentListItem) => {
    setSelectedItem(item)
    setSheetOpen(true)
  }

  const handleStatusChange = async (
    id: string,
    type: ContentType,
    action: string,
    rejectionNote?: string,
  ) => {
    const response = await fetch(`/api/v1/content/${type}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, rejectionNote }),
    })

    if (!response.ok) {
      const err = await response.json()
      toast.error(err.error ?? 'Failed to update status')
      throw new Error(err.error)
    }

    const result = (await response.json()) as { status: ContentStatus }

    // Update list optimistically
    setContent((prev) =>
      prev.map((item) =>
        item.id === id && item.type === type ? { ...item, status: result.status } : item,
      ),
    )

    const actionLabels: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      publish: 'published',
      archive: 'archived',
    }
    toast.success(`Content ${actionLabels[action] ?? action} successfully`)
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Content ({content.length})</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <ContentTable items={content} userRole={userRole} onSelectItem={handleSelectItem} />
        </TabsContent>
        <TabsContent value="generate" className="mt-6">
          <ContentGenerateForm onGenerated={handleGenerated} />
        </TabsContent>
      </Tabs>

      <ContentDetailSheet
        item={selectedItem}
        userRole={userRole}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStatusChange={handleStatusChange}
      />
    </>
  )
}
