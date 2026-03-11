import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { getValidToken } from '@/lib/google/token-manager'
import { resolveDateRange } from '@/lib/analytics/date-range'
import { analyticsDateRangeSchema } from '@/types/analytics'
import type { AnalyticsOverview, KeywordSummary, DateRangePreset } from '@/types/analytics'

async function fetchKeywordSummary(
  orgId: string,
  currentStart: string,
  currentEnd: string,
  previousStart: string,
  previousEnd: string,
): Promise<KeywordSummary> {
  const supabase = await createClient()

  // Total tracked keywords (distinct queries)
  const { data: currentData } = await supabase
    .from('keyword_rankings')
    .select('query, clicks, impressions, position')
    .eq('organization_id', orgId)
    .gte('date', currentStart)
    .lte('date', currentEnd)

  const { data: prevData } = await supabase
    .from('keyword_rankings')
    .select('query, position')
    .eq('organization_id', orgId)
    .gte('date', previousStart)
    .lte('date', previousEnd)

  // Aggregate by query
  const queryMap = new Map<string, { positionSum: number; count: number }>()
  for (const row of currentData ?? []) {
    const existing = queryMap.get(row.query)
    if (existing) {
      existing.positionSum += row.position
      existing.count += 1
    } else {
      queryMap.set(row.query, { positionSum: row.position, count: 1 })
    }
  }

  const prevQueryMap = new Map<string, { positionSum: number; count: number }>()
  for (const row of prevData ?? []) {
    const existing = prevQueryMap.get(row.query)
    if (existing) {
      existing.positionSum += row.position
      existing.count += 1
    } else {
      prevQueryMap.set(row.query, { positionSum: row.position, count: 1 })
    }
  }

  // Calculate top movers
  const movers: { query: string; change: number }[] = []
  for (const [query, data] of queryMap) {
    const prev = prevQueryMap.get(query)
    if (prev) {
      const currentAvg = data.positionSum / data.count
      const prevAvg = prev.positionSum / prev.count
      const change = Math.round((prevAvg - currentAvg) * 10) / 10
      if (change !== 0) {
        movers.push({ query, change })
      }
    }
  }

  // Sort by absolute change, take top 5
  movers.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

  // Average position across all queries
  let totalPos = 0
  let totalCount = 0
  for (const data of queryMap.values()) {
    totalPos += data.positionSum / data.count
    totalCount += 1
  }

  return {
    totalTracked: queryMap.size,
    avgPosition: totalCount > 0 ? Math.round((totalPos / totalCount) * 10) / 10 : 0,
    topMovers: movers.slice(0, 5),
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()

    const params = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = analyticsDateRangeSchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { range, startDate, endDate } = parsed.data
    const resolved = resolveDateRange(range as DateRangePreset, startDate, endDate)

    // Check connection status from DB (independent of token validity)
    const supabase = await createClient()
    const { data: connections } = await supabase
      .from('google_connections')
      .select('provider, status, site_url')
      .eq('organization_id', auth.organizationId)
      .in('provider', ['analytics', 'search_console'])

    const ga4Conn = connections?.find((c) => c.provider === 'analytics' && c.status === 'active')
    const gscConn = connections?.find(
      (c) => c.provider === 'search_console' && c.status === 'active',
    )

    // Fetch GA4 + GSC + Keywords in parallel
    const [ga4Result, gscResult, keywordsResult] = await Promise.allSettled([
      // GA4
      (async () => {
        const { accessToken, siteUrl: propertyId } = await getValidToken(
          auth.organizationId,
          'analytics',
        )
        if (!propertyId) return null
        const { batchRunReports } = await import('@/lib/google/analytics')
        const dateRanges = [
          { startDate: resolved.current.startDate, endDate: resolved.current.endDate },
        ]
        const prevDateRanges = [
          { startDate: resolved.previous.startDate, endDate: resolved.previous.endDate },
        ]
        const reports = await batchRunReports({
          accessToken,
          propertyId,
          requests: [
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
          ],
        })
        const getVal = (row: { metricValues?: { value: string }[] }, i: number): number =>
          parseFloat(row.metricValues?.[i]?.value ?? '0') || 0

        const sumRows = (rows: { metricValues?: { value: string }[] }[]) =>
          rows.reduce(
            (acc, r) => ({
              sessions: acc.sessions + getVal(r, 0),
              users: acc.users + getVal(r, 1),
              pageviews: acc.pageviews + getVal(r, 2),
              bounceRate: 0,
            }),
            { sessions: 0, users: 0, pageviews: 0, bounceRate: 0 },
          )

        const currentRows = reports[0]?.rows ?? []
        const prevRows = reports[1]?.rows ?? []
        const cur = sumRows(currentRows)
        const prev = sumRows(prevRows)
        cur.bounceRate =
          currentRows.length > 0
            ? currentRows.reduce((s, r) => s + getVal(r, 3), 0) / currentRows.length
            : 0
        const prevBounce =
          prevRows.length > 0 ? prevRows.reduce((s, r) => s + getVal(r, 3), 0) / prevRows.length : 0

        const pct = (c: number, p: number) => (p === 0 ? 0 : Math.round(((c - p) / p) * 100))

        return {
          sessions: cur.sessions,
          users: cur.users,
          pageviews: cur.pageviews,
          bounceRate: Math.round(cur.bounceRate * 1000) / 1000,
          sessionsTrend: pct(cur.sessions, prev.sessions),
          usersTrend: pct(cur.users, prev.users),
          pageviewsTrend: pct(cur.pageviews, prev.pageviews),
          bounceRateTrend: pct(cur.bounceRate, prevBounce),
        }
      })(),
      // GSC
      (async () => {
        const { accessToken, siteUrl } = await getValidToken(auth.organizationId)
        if (!siteUrl) return null
        const { fetchSearchAnalytics } = await import('@/lib/google/search-console')
        const [currentRes, prevRes] = await Promise.all([
          fetchSearchAnalytics({
            accessToken,
            siteUrl,
            ...resolved.current,
            dimensions: ['query'],
            rowLimit: 1000,
          }),
          fetchSearchAnalytics({
            accessToken,
            siteUrl,
            ...resolved.previous,
            dimensions: ['query'],
            rowLimit: 1000,
          }),
        ])
        const cur = (currentRes.rows ?? []).reduce(
          (acc, r) => ({
            clicks: acc.clicks + r.clicks,
            impressions: acc.impressions + r.impressions,
            ctr: 0,
            position: 0,
          }),
          { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        )
        const prev = (prevRes.rows ?? []).reduce(
          (acc, r) => ({
            clicks: acc.clicks + r.clicks,
            impressions: acc.impressions + r.impressions,
            ctr: 0,
            position: 0,
          }),
          { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        )
        const currentRows = currentRes.rows ?? []
        const prevRows = prevRes.rows ?? []
        cur.ctr = cur.impressions > 0 ? cur.clicks / cur.impressions : 0
        cur.position =
          currentRows.length > 0
            ? currentRows.reduce((s, r) => s + r.position, 0) / currentRows.length
            : 0
        const prevCtr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0
        const prevPosition =
          prevRows.length > 0 ? prevRows.reduce((s, r) => s + r.position, 0) / prevRows.length : 0

        const pct = (c: number, p: number) => (p === 0 ? 0 : Math.round(((c - p) / p) * 100))

        return {
          clicks: cur.clicks,
          impressions: cur.impressions,
          ctr: Math.round(cur.ctr * 1000) / 1000,
          position: Math.round(cur.position * 10) / 10,
          clicksTrend: pct(cur.clicks, prev.clicks),
          impressionsTrend: pct(cur.impressions, prev.impressions),
          ctrTrend: pct(cur.ctr, prevCtr),
          positionTrend: pct(cur.position, prevPosition),
        }
      })(),
      // Keywords
      fetchKeywordSummary(
        auth.organizationId,
        resolved.current.startDate,
        resolved.current.endDate,
        resolved.previous.startDate,
        resolved.previous.endDate,
      ),
    ])

    const overview: AnalyticsOverview = {
      ga4Connected: !!ga4Conn,
      gscConnected: !!gscConn,
      ga4: ga4Result.status === 'fulfilled' ? ga4Result.value : null,
      gsc: gscResult.status === 'fulfilled' ? gscResult.value : null,
      keywords:
        keywordsResult.status === 'fulfilled'
          ? keywordsResult.value
          : { totalTracked: 0, avgPosition: 0, topMovers: [] },
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Analytics Overview Error]', err)
    return NextResponse.json({ error: 'Failed to fetch analytics overview' }, { status: 500 })
  }
}
