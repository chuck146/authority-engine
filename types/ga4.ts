import { z } from 'zod'

// --- Google Analytics 4 Types ---

// Admin API — Account & Property Summaries
export type Ga4PropertySummary = {
  property: string // e.g. "properties/123456789"
  displayName: string
  propertyType: string
  parent: string
}

export type Ga4AccountSummary = {
  name: string // e.g. "accountSummaries/123456789"
  account: string // e.g. "accounts/123456789"
  displayName: string
  propertySummaries: Ga4PropertySummary[]
}

// Data API — Report Request/Response
export type Ga4DateRange = {
  startDate: string // YYYY-MM-DD or relative (e.g. "28daysAgo")
  endDate: string // YYYY-MM-DD or relative (e.g. "yesterday")
}

export type Ga4ReportRequest = {
  dateRanges: Ga4DateRange[]
  dimensions?: { name: string }[]
  metrics: { name: string }[]
  limit?: number
  offset?: number
  orderBys?: { dimension?: { dimensionName: string }; metric?: { metricName: string }; desc?: boolean }[]
}

export type Ga4DimensionValue = {
  value: string
}

export type Ga4MetricValue = {
  value: string
}

export type Ga4ReportRow = {
  dimensionValues?: Ga4DimensionValue[]
  metricValues?: Ga4MetricValue[]
}

export type Ga4ReportResponse = {
  dimensionHeaders?: { name: string }[]
  metricHeaders?: { name: string; type: string }[]
  rows?: Ga4ReportRow[]
  rowCount?: number
  metadata?: Record<string, unknown>
}

// --- Dashboard / Overview Types ---

export type Ga4Summary = {
  sessions: number
  users: number
  pageviews: number
  bounceRate: number // 0–1
  sessionsTrend: number // percent change vs previous period
  usersTrend: number
  pageviewsTrend: number
  bounceRateTrend: number
}

export type Ga4TrafficTrendPoint = {
  date: string
  sessions: number
  users: number
  pageviews: number
}

export type Ga4PageMetric = {
  pagePath: string
  pageTitle: string
  sessions: number
  users: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
}

export type Ga4TrafficSource = {
  source: string
  medium: string
  sessions: number
  users: number
  bounceRate: number
}

export type Ga4DeviceBreakdown = {
  deviceCategory: string // "desktop" | "mobile" | "tablet"
  sessions: number
  users: number
  percentage: number // 0–100
}

export type Ga4Overview = {
  isConnected: boolean
  propertyId: string | null
  lastSyncedAt: string | null
  summary: Ga4Summary | null
  dailyTrend: Ga4TrafficTrendPoint[]
  topPages: Ga4PageMetric[]
  trafficSources: Ga4TrafficSource[]
  deviceBreakdown: Ga4DeviceBreakdown[]
}

// --- Zod Schemas ---

export const ga4ReportQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  dimensions: z.array(z.string()).optional(),
  metrics: z.array(z.string()).min(1),
  limit: z.coerce.number().int().min(1).max(100000).default(1000),
  offset: z.coerce.number().int().min(0).default(0),
})

export const ga4PropertySelectSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
})
