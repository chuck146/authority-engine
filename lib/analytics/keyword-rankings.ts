import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  DateRange,
  KeywordRankingListItem,
  KeywordTrendPoint,
  AnalyticsKeywordsResponse,
} from '@/types/analytics'

type SortField = 'clicks' | 'impressions' | 'position' | 'ctr' | 'change'
type SortOrder = 'asc' | 'desc'

type GetKeywordRankingsOptions = {
  sort: SortField
  order: SortOrder
  page: number
  pageSize: number
  search?: string
}

export async function getKeywordRankings(
  supabase: SupabaseClient<Database>,
  orgId: string,
  currentRange: DateRange,
  previousRange: DateRange,
  options: GetKeywordRankingsOptions,
): Promise<AnalyticsKeywordsResponse> {
  const { sort, order, page, pageSize, search } = options

  // Fetch current period aggregated by query
  let currentQuery = supabase
    .from('keyword_rankings')
    .select('query, clicks, impressions, ctr, position')
    .eq('organization_id', orgId)
    .gte('date', currentRange.startDate)
    .lte('date', currentRange.endDate)

  if (search) {
    currentQuery = currentQuery.ilike('query', `%${search}%`)
  }

  const { data: currentRows, error: currentError } = await currentQuery

  if (currentError) {
    throw new Error(`Failed to fetch keyword rankings: ${currentError.message}`)
  }

  // Fetch previous period for position change calculation
  let prevQuery = supabase
    .from('keyword_rankings')
    .select('query, position')
    .eq('organization_id', orgId)
    .gte('date', previousRange.startDate)
    .lte('date', previousRange.endDate)

  if (search) {
    prevQuery = prevQuery.ilike('query', `%${search}%`)
  }

  const { data: prevRows, error: prevError } = await prevQuery

  if (prevError) {
    throw new Error(`Failed to fetch previous keyword rankings: ${prevError.message}`)
  }

  // Aggregate current period by query
  const currentMap = new Map<
    string,
    { clicks: number; impressions: number; ctrSum: number; positionSum: number; count: number }
  >()

  for (const row of currentRows ?? []) {
    const existing = currentMap.get(row.query)
    if (existing) {
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.ctrSum += row.ctr
      existing.positionSum += row.position
      existing.count += 1
    } else {
      currentMap.set(row.query, {
        clicks: row.clicks,
        impressions: row.impressions,
        ctrSum: row.ctr,
        positionSum: row.position,
        count: 1,
      })
    }
  }

  // Aggregate previous period by query (position only)
  const prevMap = new Map<string, { positionSum: number; count: number }>()
  for (const row of prevRows ?? []) {
    const existing = prevMap.get(row.query)
    if (existing) {
      existing.positionSum += row.position
      existing.count += 1
    } else {
      prevMap.set(row.query, { positionSum: row.position, count: 1 })
    }
  }

  // Build items
  const items: KeywordRankingListItem[] = []
  for (const [query, data] of currentMap) {
    const avgPosition = Math.round((data.positionSum / data.count) * 10) / 10
    const avgCtr =
      data.impressions > 0
        ? Math.round((data.clicks / data.impressions) * 1000) / 1000
        : Math.round((data.ctrSum / data.count) * 1000) / 1000

    const prev = prevMap.get(query)
    let positionChange: number | null = null
    if (prev) {
      const prevAvgPosition = prev.positionSum / prev.count
      // Positive = improved (moved up), negative = worsened
      positionChange = Math.round((prevAvgPosition - avgPosition) * 10) / 10
    }

    items.push({
      query,
      avgPosition,
      totalClicks: data.clicks,
      totalImpressions: data.impressions,
      avgCtr,
      positionChange,
    })
  }

  // Sort
  items.sort((a, b) => {
    let cmp = 0
    switch (sort) {
      case 'clicks':
        cmp = a.totalClicks - b.totalClicks
        break
      case 'impressions':
        cmp = a.totalImpressions - b.totalImpressions
        break
      case 'position':
        cmp = a.avgPosition - b.avgPosition
        break
      case 'ctr':
        cmp = a.avgCtr - b.avgCtr
        break
      case 'change':
        cmp = (a.positionChange ?? 0) - (b.positionChange ?? 0)
        break
    }
    return order === 'desc' ? -cmp : cmp
  })

  // Paginate
  const total = items.length
  const start = (page - 1) * pageSize
  const paginated = items.slice(start, start + pageSize)

  return { items: paginated, total, page, pageSize }
}

export async function getKeywordTrend(
  supabase: SupabaseClient<Database>,
  orgId: string,
  query: string,
  dateRange: DateRange,
): Promise<KeywordTrendPoint[]> {
  const { data, error } = await supabase
    .from('keyword_rankings')
    .select('date, clicks, impressions, position')
    .eq('organization_id', orgId)
    .eq('query', query)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch keyword trend: ${error.message}`)
  }

  // Aggregate by date (may have multiple pages/devices per date)
  const dateMap = new Map<
    string,
    { clicks: number; impressions: number; positionSum: number; count: number }
  >()

  for (const row of data ?? []) {
    const dateStr = typeof row.date === 'string' ? row.date : String(row.date)
    const existing = dateMap.get(dateStr)
    if (existing) {
      existing.clicks += row.clicks
      existing.impressions += row.impressions
      existing.positionSum += row.position
      existing.count += 1
    } else {
      dateMap.set(dateStr, {
        clicks: row.clicks,
        impressions: row.impressions,
        positionSum: row.position,
        count: 1,
      })
    }
  }

  return Array.from(dateMap.entries())
    .map(([date, d]) => ({
      date,
      position: Math.round((d.positionSum / d.count) * 10) / 10,
      clicks: d.clicks,
      impressions: d.impressions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}
