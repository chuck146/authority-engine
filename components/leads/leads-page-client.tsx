'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadPipelineView } from './lead-pipeline-view'
import { LeadList } from './lead-list'
import { LeadOverviewCards } from './lead-overview-cards'

export function LeadsPageClient() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <Tabs defaultValue="pipeline" onValueChange={() => setRefreshKey((k) => k + 1)}>
      <TabsList>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="all">All Leads</TabsTrigger>
        <TabsTrigger value="overview">Overview</TabsTrigger>
      </TabsList>
      <TabsContent value="pipeline">
        <LeadPipelineView refreshKey={refreshKey} />
      </TabsContent>
      <TabsContent value="all">
        <LeadList refreshKey={refreshKey} />
      </TabsContent>
      <TabsContent value="overview">
        <LeadOverviewCards refreshKey={refreshKey} />
      </TabsContent>
    </Tabs>
  )
}
