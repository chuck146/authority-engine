import type { ContentType } from './content'
import type { ContentStatus } from './index'

// --- Hero Metrics (top row) ---

export type HeroMetrics = {
  totalPublished: number
  averageSeoScore: number
  contentInReview: number
  nextScheduledPublish: string | null // ISO date or null
}

// --- Content Pipeline ---

export type StatusBreakdown = Record<ContentStatus, number>

export type ContentTypeBreakdown = {
  contentType: ContentType
  label: string
  total: number
  published: number
}

export type ContentPipeline = {
  statusBreakdown: StatusBreakdown
  totalContent: number
  byType: ContentTypeBreakdown[]
}

// --- Recent Activity ---

export type RecentActivityItem = {
  id: string
  contentType: ContentType
  title: string
  slug: string
  status: string
  publishedAt: string
}

// --- Aggregated Response ---

export type DashboardMetrics = {
  hero: HeroMetrics
  pipeline: ContentPipeline
  recentActivity: RecentActivityItem[]
}
