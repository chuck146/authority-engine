import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { batchRunReports } from '@/lib/google/analytics'
import type {
  Ga4Overview,
  Ga4Summary,
  Ga4TrafficTrendPoint,
  Ga4PageMetric,
  Ga4TrafficSource,
  Ga4DeviceBreakdown,
  Ga4ReportRequest,
  Ga4ReportRow,
} from '@/types/ga4'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function computeDateRanges() {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() - 1) // yesterday

  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 27) // 28-day window

  const prevEndDate = new Date(startDate)
  prevEndDate.setDate(prevEndDate.getDate() - 1)

  const prevStartDate = new Date(prevEndDate)
  prevStartDate.setDate(prevStartDate.getDate() - 27)

  return {
    current: { startDate: formatDate(startDate), endDate: formatDate(endDate) },
    previous: { startDate: formatDate(prevStartDate), endDate: formatDate(prevEndDate) },
  }
}

function getMetricValue(row: Ga4ReportRow, index: number): number {
  return parseFloat(row.metricValues?.[index]?.value ?? '0') || 0
}

function getDimensionValue(row: Ga4ReportRow, index: number): string {
  return row.dimensionValues?.[index]?.value ?? ''
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

function buildSummary(currentRows: Ga4ReportRow[], previousRows: Ga4ReportRow[]): Ga4Summary {
  const sum = (rows: Ga4ReportRow[]) =>
    rows.reduce(
      (acc, r) => ({
        sessions: acc.sessions + getMetricValue(r, 0),
        users: acc.users + getMetricValue(r, 1),
        pageviews: acc.pageviews + getMetricValue(r, 2),
        bounceRate: 0,
      }),
      { sessions: 0, users: 0, pageviews: 0, bounceRate: 0 },
    )

  const cur = sum(currentRows)
  const prev = sum(previousRows)

  // Bounce rate from first row (aggregate) if available
  cur.bounceRate =
    currentRows.length > 0
      ? currentRows.reduce((s, r) => s + getMetricValue(r, 3), 0) / currentRows.length
      : 0
  const prevBounceRate =
    previousRows.length > 0
      ? previousRows.reduce((s, r) => s + getMetricValue(r, 3), 0) / previousRows.length
      : 0

  return {
    sessions: cur.sessions,
    users: cur.users,
    pageviews: cur.pageviews,
    bounceRate: Math.round(cur.bounceRate * 1000) / 1000,
    sessionsTrend: pctChange(cur.sessions, prev.sessions),
    usersTrend: pctChange(cur.users, prev.users),
    pageviewsTrend: pctChange(cur.pageviews, prev.pageviews),
    bounceRateTrend: pctChange(cur.bounceRate, prevBounceRate),
  }
}

function buildDailyTrend(rows: Ga4ReportRow[]): Ga4TrafficTrendPoint[] {
  return rows
    .map((r) => ({
      date: getDimensionValue(r, 0),
      sessions: getMetricValue(r, 0),
      users: getMetricValue(r, 1),
      pageviews: getMetricValue(r, 2),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function buildTopPages(rows: Ga4ReportRow[]): Ga4PageMetric[] {
  return rows
    .map((r) => ({
      pagePath: getDimensionValue(r, 0),
      pageTitle: getDimensionValue(r, 1),
      sessions: getMetricValue(r, 0),
      users: getMetricValue(r, 1),
      pageviews: getMetricValue(r, 2),
      bounceRate: Math.round(getMetricValue(r, 3) * 1000) / 1000,
      avgSessionDuration: Math.round(getMetricValue(r, 4) * 10) / 10,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)
}

function buildTrafficSources(rows: Ga4ReportRow[]): Ga4TrafficSource[] {
  return rows
    .map((r) => ({
      source: getDimensionValue(r, 0),
      medium: getDimensionValue(r, 1),
      sessions: getMetricValue(r, 0),
      users: getMetricValue(r, 1),
      bounceRate: Math.round(getMetricValue(r, 2) * 1000) / 1000,
    }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 20)
}

function buildDeviceBreakdown(rows: Ga4ReportRow[]): Ga4DeviceBreakdown[] {
  const totalSessions = rows.reduce((s, r) => s + getMetricValue(r, 0), 0)
  return rows.map((r) => {
    const sessions = getMetricValue(r, 0)
    return {
      deviceCategory: getDimensionValue(r, 0),
      sessions,
      users: getMetricValue(r, 1),
      percentage: totalSessions > 0 ? Math.round((sessions / totalSessions) * 1000) / 10 : 0,
    }
  })
}

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const { accessToken, siteUrl: propertyId } = await getValidToken(
      auth.organizationId,
      'analytics',
    )

    if (!propertyId) {
      return NextResponse.json(
        {
          error:
            'GA4 property not selected. Go to Settings > Integrations to select your property.',
        },
        { status: 400 },
      )
    }

    const ranges = computeDateRanges()

    const dateRanges = [{ startDate: ranges.current.startDate, endDate: ranges.current.endDate }]
    const prevDateRanges = [
      { startDate: ranges.previous.startDate, endDate: ranges.previous.endDate },
    ]

    // Batch: 4 current + 1 previous (for summary trends)
    const requests: Ga4ReportRequest[] = [
      // 0: Daily totals (current period)
      {
        dateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
        ],
      },
      // 1: Top pages
      {
        dateRanges,
        dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
        limit: 50,
      },
      // 2: Traffic sources
      {
        dateRanges,
        dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'bounceRate' }],
        limit: 50,
      },
      // 3: Device breakdown
      {
        dateRanges,
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
      },
      // 4: Daily totals (previous period — for trend computation)
      {
        dateRanges: prevDateRanges,
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
        ],
      },
    ]

    const reports = await batchRunReports({
      accessToken,
      propertyId,
      requests,
    })

    const dailyRows = reports[0]?.rows ?? []
    const pageRows = reports[1]?.rows ?? []
    const sourceRows = reports[2]?.rows ?? []
    const deviceRows = reports[3]?.rows ?? []
    const prevDailyRows = reports[4]?.rows ?? []

    const overview: Ga4Overview = {
      isConnected: true,
      propertyId,
      lastSyncedAt: new Date().toISOString(),
      summary: buildSummary(dailyRows, prevDailyRows),
      dailyTrend: buildDailyTrend(dailyRows),
      topPages: buildTopPages(pageRows),
      trafficSources: buildTrafficSources(sourceRows),
      deviceBreakdown: buildDeviceBreakdown(deviceRows),
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GA4 Overview Error]', err)
    return NextResponse.json({ error: 'Failed to fetch GA4 overview' }, { status: 500 })
  }
}
