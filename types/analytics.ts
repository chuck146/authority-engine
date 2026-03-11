import { z } from 'zod'

// --- Date Range ---

export type DateRangePreset = '7d' | '28d' | '90d' | 'custom'

export type DateRange = {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}

// --- Keyword Rankings ---

export type KeywordRankingListItem = {
  query: string
  avgPosition: number
  totalClicks: number
  totalImpressions: number
  avgCtr: number
  positionChange: number | null // vs previous period
}

export type KeywordTrendPoint = {
  date: string
  position: number
  clicks: number
  impressions: number
}

export type AnalyticsKeywordsResponse = {
  items: KeywordRankingListItem[]
  total: number
  page: number
  pageSize: number
}

// --- Analytics Overview ---

export type KeywordSummary = {
  totalTracked: number
  avgPosition: number
  topMovers: { query: string; change: number }[]
}

export type AnalyticsOverview = {
  ga4Connected: boolean
  gscConnected: boolean
  ga4: {
    sessions: number
    users: number
    pageviews: number
    bounceRate: number
    sessionsTrend: number
    usersTrend: number
    pageviewsTrend: number
    bounceRateTrend: number
  } | null
  gsc: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    clicksTrend: number
    impressionsTrend: number
    ctrTrend: number
    positionTrend: number
  } | null
  keywords: KeywordSummary
}

// --- Zod Schemas ---

export const analyticsDateRangeSchema = z.object({
  range: z.enum(['7d', '28d', '90d', 'custom']).default('28d'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
})

export const analyticsKeywordsQuerySchema = z.object({
  range: z.enum(['7d', '28d', '90d', 'custom']).default('28d'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sort: z.enum(['clicks', 'impressions', 'position', 'ctr', 'change']).default('clicks'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
})

// --- Content Performance ---

export type ContentPerformanceItem = {
  id: string
  title: string
  slug: string
  contentType: 'service_page' | 'location_page' | 'blog_post'
  seoScore: number | null
  publishedAt: string | null
  sessions: number
  users: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  engagementRate: number
  topKeyword: string | null
  keywordCount: number
}

export type ContentPerformanceResponse = {
  items: ContentPerformanceItem[]
  total: number
  page: number
  pageSize: number
}

export const contentPerformanceQuerySchema = z.object({
  range: z.enum(['7d', '28d', '90d', 'custom']).default('28d'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.enum(['all', 'service_page', 'location_page', 'blog_post']).default('all'),
  sort: z
    .enum([
      'title',
      'seoScore',
      'sessions',
      'users',
      'pageviews',
      'bounceRate',
      'engagementRate',
      'publishedAt',
    ])
    .default('sessions'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
})

export const analyticsKeywordTrendQuerySchema = z.object({
  range: z.enum(['7d', '28d', '90d', 'custom']).default('28d'),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})
