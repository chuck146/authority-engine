'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SocialPostList } from './social-post-list'
import { SocialGenerateForm } from './social-generate-form'

export function SocialPageClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  function handleGenerated() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All Posts</TabsTrigger>
        <TabsTrigger value="gbp">GBP</TabsTrigger>
        <TabsTrigger value="instagram">Instagram</TabsTrigger>
        <TabsTrigger value="facebook">Facebook</TabsTrigger>
        <TabsTrigger value="generate">Generate</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <SocialPostList key={`all-${refreshKey}`} />
      </TabsContent>
      <TabsContent value="gbp">
        <SocialPostList key={`gbp-${refreshKey}`} platform="gbp" />
      </TabsContent>
      <TabsContent value="instagram">
        <SocialPostList key={`ig-${refreshKey}`} platform="instagram" />
      </TabsContent>
      <TabsContent value="facebook">
        <SocialPostList key={`fb-${refreshKey}`} platform="facebook" />
      </TabsContent>
      <TabsContent value="generate">
        <SocialGenerateForm onGenerated={handleGenerated} />
      </TabsContent>
    </Tabs>
  )
}
