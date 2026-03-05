import { z } from 'zod'

// --- Google Search Console Types ---

export type GscConnectionStatus = 'active' | 'error' | 'disconnected'
export type GscProvider = 'search_console' | 'analytics' | 'business_profile'

export type GscConnection = {
  id: string
  organizationId: string
  provider: GscProvider
  siteUrl: string
  status: GscConnectionStatus
  lastSyncedAt: string | null
  syncError: string | null
  connectedBy: string
  createdAt: string
}

// --- Search Analytics ---

export type SearchAnalyticsRow = {
  query: string
  page: string
  country: string
  device: string
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type SearchAnalyticsDimension = 'query' | 'page' | 'country' | 'device' | 'date'

export const searchAnalyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  dimensions: z
    .array(z.enum(['query', 'page', 'country', 'device', 'date']))
    .min(1)
    .max(4)
    .optional(),
  rowLimit: z.coerce.number().int().min(1).max(25000).default(1000),
  startRow: z.coerce.number().int().min(0).default(0),
})

export type SearchAnalyticsQuery = z.infer<typeof searchAnalyticsQuerySchema>

// --- Sitemaps ---

export type GscSitemap = {
  path: string
  lastSubmitted: string | null
  isPending: boolean
  lastDownloaded: string | null
  warnings: number
  errors: number
  contents: GscSitemapContent[]
}

export type GscSitemapContent = {
  type: string
  submitted: number
  indexed: number
}

// --- URL Inspection ---

export const urlInspectionSchema = z.object({
  url: z.string().url('Must be a valid URL'),
})

export type UrlInspectionRequest = z.infer<typeof urlInspectionSchema>

export type UrlInspectionResult = {
  inspectionUrl: string
  indexingState:
    | 'INDEXING_ALLOWED'
    | 'BLOCKED_BY_META_TAG'
    | 'BLOCKED_BY_HTTP_HEADER'
    | 'BLOCKED_BY_ROBOTS_TXT'
    | 'UNKNOWN'
  coverageState:
    | 'SUBMITTED_AND_INDEXED'
    | 'CRAWLED_NOT_INDEXED'
    | 'DISCOVERED_NOT_INDEXED'
    | 'URL_IS_UNKNOWN'
    | 'DUPLICATE'
    | string
  lastCrawlTime: string | null
  crawlAllowed: boolean
  robotsTxtState: 'ALLOWED' | 'DISALLOWED' | 'UNKNOWN'
  pageFetchState:
    | 'SUCCESSFUL'
    | 'SOFT_404'
    | 'BLOCKED_BY_ROBOTS_TXT'
    | 'NOT_FOUND'
    | 'SERVER_ERROR'
    | string
  mobileUsability: 'MOBILE_FRIENDLY' | 'NOT_MOBILE_FRIENDLY' | 'UNKNOWN'
  richResults: RichResultItem[]
}

export type RichResultItem = {
  richResultType: string
  items: { name: string; issues: string[] }[]
}

// --- Overview / Dashboard ---

export type GscOverview = {
  isConnected: boolean
  siteUrl: string | null
  lastSyncedAt: string | null
  summary: GscSummary | null
  topQueries: KeywordRankingItem[]
  topPages: PagePerformanceItem[]
  sitemaps: GscSitemap[]
  indexingCoverage: IndexingCoverage | null
}

export type GscSummary = {
  clicks: number
  impressions: number
  ctr: number
  position: number
  clicksTrend: number // percent change vs previous period
  impressionsTrend: number
  ctrTrend: number
  positionTrend: number // negative = improvement (lower position)
}

export type KeywordRankingItem = {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  positionChange: number | null // vs previous period
}

export type PagePerformanceItem = {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export type IndexingCoverage = {
  valid: number
  warnings: number
  errors: number
  excluded: number
}

export type CrawlError = {
  url: string
  category: string
  lastCrawled: string
  firstDetected: string
  responseCode: number
}

// --- Keyword Trends (sparkline data) ---

export type KeywordTrendPoint = {
  date: string
  position: number
  clicks: number
  impressions: number
}
