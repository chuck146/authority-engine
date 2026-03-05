'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ReviewList } from './review-list'
import { ReviewEntryForm } from './review-entry-form'
import { ReviewOverviewCards } from './review-overview-cards'

export function ReviewsPageClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  function handleCreated() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">All Reviews</TabsTrigger>
        <TabsTrigger value="google">Google</TabsTrigger>
        <TabsTrigger value="yelp">Yelp</TabsTrigger>
        <TabsTrigger value="angi">Angi&apos;s</TabsTrigger>
        <TabsTrigger value="manual">Manual</TabsTrigger>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="add">Add Review</TabsTrigger>
      </TabsList>
      <TabsContent value="all">
        <ReviewList key={`all-${refreshKey}`} />
      </TabsContent>
      <TabsContent value="google">
        <ReviewList key={`google-${refreshKey}`} platform="google" />
      </TabsContent>
      <TabsContent value="yelp">
        <ReviewList key={`yelp-${refreshKey}`} platform="yelp" />
      </TabsContent>
      <TabsContent value="angi">
        <ReviewList key={`angi-${refreshKey}`} platform="angi" />
      </TabsContent>
      <TabsContent value="manual">
        <ReviewList key={`manual-${refreshKey}`} platform="manual" />
      </TabsContent>
      <TabsContent value="overview">
        <ReviewOverviewCards key={`overview-${refreshKey}`} />
      </TabsContent>
      <TabsContent value="add">
        <ReviewEntryForm onCreated={handleCreated} />
      </TabsContent>
    </Tabs>
  )
}
