import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { fetchSearchAnalytics, fetchSitemaps } from '@/lib/google/search-console'
import type {
  GscOverview,
  GscSummary,
  KeywordRankingItem,
  PagePerformanceItem,
  GscSitemap,
  IndexingCoverage,
} from '@/types/gsc'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function computeDateRanges() {
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() - 1) // yesterday (GSC data has ~2 day lag)

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

function computeSummary(
  currentRows: { clicks: number; impressions: number; ctr: number; position: number }[],
  previousRows: { clicks: number; impressions: number; ctr: number; position: number }[],
): GscSummary {
  const sum = (rows: typeof currentRows) =>
    rows.reduce(
      (acc, r) => ({
        clicks: acc.clicks + r.clicks,
        impressions: acc.impressions + r.impressions,
        ctr: 0,
        position: 0,
      }),
      { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    )

  const cur = sum(currentRows)
  const prev = sum(previousRows)

  cur.ctr = cur.impressions > 0 ? cur.clicks / cur.impressions : 0
  cur.position =
    currentRows.length > 0
      ? currentRows.reduce((s, r) => s + r.position, 0) / currentRows.length
      : 0

  const prevCtr = prev.impressions > 0 ? prev.clicks / prev.impressions : 0
  const prevPosition =
    previousRows.length > 0
      ? previousRows.reduce((s, r) => s + r.position, 0) / previousRows.length
      : 0

  const pctChange = (current: number, previous: number) =>
    previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100)

  return {
    clicks: cur.clicks,
    impressions: cur.impressions,
    ctr: Math.round(cur.ctr * 1000) / 1000,
    position: Math.round(cur.position * 10) / 10,
    clicksTrend: pctChange(cur.clicks, prev.clicks),
    impressionsTrend: pctChange(cur.impressions, prev.impressions),
    ctrTrend: pctChange(cur.ctr, prevCtr),
    positionTrend: pctChange(cur.position, prevPosition),
  }
}

function mapTopQueries(
  currentRows: {
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }[],
  previousRows: {
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }[],
): KeywordRankingItem[] {
  const prevMap = new Map(previousRows.map((r) => [r.keys[0], r.position]))

  return currentRows
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)
    .map((r) => {
      const prevPos = prevMap.get(r.keys[0]!)
      return {
        query: r.keys[0]!,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: Math.round(r.ctr * 1000) / 1000,
        position: Math.round(r.position * 10) / 10,
        positionChange: prevPos != null ? Math.round((prevPos - r.position) * 10) / 10 : null,
      }
    })
}

function mapTopPages(
  rows: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[],
): PagePerformanceItem[] {
  return rows
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 20)
    .map((r) => ({
      page: r.keys[0]!,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 1000) / 1000,
      position: Math.round(r.position * 10) / 10,
    }))
}

function mapSitemaps(
  raw: {
    path: string
    lastSubmitted?: string
    isPending: boolean
    lastDownloaded?: string
    warnings: string
    errors: string
    contents?: { type: string; submitted: string; indexed: string }[]
  }[],
): GscSitemap[] {
  return raw.map((s) => ({
    path: s.path,
    lastSubmitted: s.lastSubmitted ?? null,
    isPending: s.isPending,
    lastDownloaded: s.lastDownloaded ?? null,
    warnings: parseInt(s.warnings) || 0,
    errors: parseInt(s.errors) || 0,
    contents: (s.contents ?? []).map((c) => ({
      type: c.type,
      submitted: parseInt(c.submitted) || 0,
      indexed: parseInt(c.indexed) || 0,
    })),
  }))
}

function computeIndexingCoverage(sitemaps: GscSitemap[]): IndexingCoverage | null {
  if (sitemaps.length === 0) return null

  let submitted = 0
  let indexed = 0
  for (const s of sitemaps) {
    for (const c of s.contents) {
      submitted += c.submitted
      indexed += c.indexed
    }
  }

  return {
    valid: indexed,
    warnings: 0,
    errors: sitemaps.reduce((s, sm) => s + sm.errors, 0),
    excluded: submitted - indexed,
  }
}

const emptyAnalytics = { rows: [] }

export async function GET() {
  try {
    const auth = await requireApiAuth()

    let accessToken: string
    let siteUrl: string
    try {
      const token = await getValidToken(auth.organizationId)
      accessToken = token.accessToken
      siteUrl = token.siteUrl
    } catch {
      // No active GSC connection — return disconnected state
      return NextResponse.json({
        isConnected: false,
        siteUrl: null,
        lastSyncedAt: null,
        summary: null,
        topQueries: [],
        topPages: [],
        sitemaps: [],
        indexingCoverage: null,
      } satisfies GscOverview)
    }

    // Empty site_url means OAuth succeeded but no verified site was found
    if (!siteUrl) {
      return NextResponse.json({
        isConnected: true,
        siteUrl: '',
        lastSyncedAt: null,
        summary: null,
        topQueries: [],
        topPages: [],
        sitemaps: [],
        indexingCoverage: null,
        message: 'No verified site found in Google Search Console. Please verify your domain.',
      })
    }

    const ranges = computeDateRanges()

    // Use allSettled so partial failures don't break the entire response
    const [currentQueriesResult, previousQueriesResult, currentPagesResult, sitemapsResult] =
      await Promise.allSettled([
        fetchSearchAnalytics({
          accessToken,
          siteUrl,
          ...ranges.current,
          dimensions: ['query'],
          rowLimit: 1000,
        }),
        fetchSearchAnalytics({
          accessToken,
          siteUrl,
          ...ranges.previous,
          dimensions: ['query'],
          rowLimit: 1000,
        }),
        fetchSearchAnalytics({
          accessToken,
          siteUrl,
          ...ranges.current,
          dimensions: ['page'],
          rowLimit: 100,
        }),
        fetchSitemaps({ accessToken, siteUrl }),
      ])

    const currentQueries =
      currentQueriesResult.status === 'fulfilled' ? currentQueriesResult.value : emptyAnalytics
    const previousQueries =
      previousQueriesResult.status === 'fulfilled' ? previousQueriesResult.value : emptyAnalytics
    const currentPages =
      currentPagesResult.status === 'fulfilled' ? currentPagesResult.value : emptyAnalytics
    const rawSitemaps = sitemapsResult.status === 'fulfilled' ? sitemapsResult.value : []

    // Log any partial failures for diagnostics
    const failures = [
      currentQueriesResult,
      previousQueriesResult,
      currentPagesResult,
      sitemapsResult,
    ].filter((r) => r.status === 'rejected')
    if (failures.length > 0) {
      console.warn(
        '[GSC Overview] Partial API failures:',
        failures.map((f) => (f as PromiseRejectedResult).reason?.message ?? 'Unknown error'),
      )
    }

    const currentRows = currentQueries.rows ?? []
    const previousRows = previousQueries.rows ?? []
    const pageRows = currentPages.rows ?? []

    const sitemaps = mapSitemaps(rawSitemaps)

    const overview: GscOverview = {
      isConnected: true,
      siteUrl,
      lastSyncedAt: new Date().toISOString(),
      summary: computeSummary(currentRows, previousRows),
      topQueries: mapTopQueries(currentRows, previousRows),
      topPages: mapTopPages(pageRows),
      sitemaps,
      indexingCoverage: computeIndexingCoverage(sitemaps),
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    const detail = err instanceof Error ? err.message : 'Unknown error'
    console.error('[GSC Overview Error]', detail)
    return NextResponse.json({ error: 'Failed to fetch GSC overview', detail }, { status: 500 })
  }
}
