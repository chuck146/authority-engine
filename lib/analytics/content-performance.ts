import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type {
  DateRange,
  ContentPerformanceItem,
  ContentPerformanceResponse,
} from '@/types/analytics'

type ContentType = 'service_page' | 'location_page' | 'blog_post'
type SortField =
  | 'title'
  | 'seoScore'
  | 'sessions'
  | 'users'
  | 'pageviews'
  | 'bounceRate'
  | 'engagementRate'
  | 'publishedAt'
type SortOrder = 'asc' | 'desc'

export type GetContentPerformanceOptions = {
  type: 'all' | ContentType
  sort: SortField
  order: SortOrder
  page: number
  pageSize: number
  search?: string
}

type ContentRow = {
  id: string
  title: string
  slug: string
  seo_score: number | null
  published_at: string | null
}

const PATH_PREFIXES: Record<ContentType, string> = {
  service_page: '/services/',
  location_page: '/locations/',
  blog_post: '/blog/',
}

function buildPagePath(contentType: ContentType, slug: string): string {
  return `${PATH_PREFIXES[contentType]}${slug}`
}

async function fetchPublishedContent(
  supabase: SupabaseClient<Database>,
  orgId: string,
  contentType: ContentType,
  search?: string,
): Promise<(ContentRow & { contentType: ContentType })[]> {
  const table = {
    service_page: 'service_pages',
    location_page: 'location_pages',
    blog_post: 'blog_posts',
  }[contentType] as 'service_pages' | 'location_pages' | 'blog_posts'

  let query = supabase
    .from(table)
    .select('id, title, slug, seo_score, published_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch ${table}: ${error.message}`)
  }

  return (data ?? []).map((row) => ({ ...row, contentType }))
}

export async function getContentPerformance(
  supabase: SupabaseClient<Database>,
  orgId: string,
  dateRange: DateRange,
  options: GetContentPerformanceOptions,
): Promise<ContentPerformanceResponse> {
  const { type, sort, order, page, pageSize, search } = options

  // 1. Fetch published content from relevant tables
  const contentTypes: ContentType[] =
    type === 'all' ? ['service_page', 'location_page', 'blog_post'] : [type]

  const contentResults = await Promise.all(
    contentTypes.map((ct) => fetchPublishedContent(supabase, orgId, ct, search)),
  )
  const allContent = contentResults.flat()

  if (allContent.length === 0) {
    return { items: [], total: 0, page, pageSize }
  }

  // 2. Build slug → page_path mapping
  const pathToContent = new Map<string, ContentRow & { contentType: ContentType }>()
  for (const content of allContent) {
    const pagePath = buildPagePath(content.contentType, content.slug)
    pathToContent.set(pagePath, content)
  }

  const allPaths = Array.from(pathToContent.keys())

  // 3. Fetch GA4 metrics for date range
  const { data: ga4Rows, error: ga4Error } = await supabase
    .from('ga4_page_metrics')
    .select(
      'page_path, sessions, users, pageviews, bounce_rate, avg_session_duration, engagement_rate',
    )
    .eq('organization_id', orgId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate)
    .in('page_path', allPaths)

  if (ga4Error) {
    throw new Error(`Failed to fetch GA4 metrics: ${ga4Error.message}`)
  }

  // Aggregate GA4 by page_path
  const ga4Map = new Map<
    string,
    {
      sessions: number
      users: number
      pageviews: number
      bounceRateWeighted: number
      avgSessionDurationWeighted: number
      engagementRateWeighted: number
      totalSessionsForWeighting: number
    }
  >()

  for (const row of ga4Rows ?? []) {
    const existing = ga4Map.get(row.page_path)
    if (existing) {
      existing.sessions += row.sessions
      existing.users += row.users
      existing.pageviews += row.pageviews
      existing.bounceRateWeighted += row.bounce_rate * row.sessions
      existing.avgSessionDurationWeighted += row.avg_session_duration * row.sessions
      existing.engagementRateWeighted += row.engagement_rate * row.sessions
      existing.totalSessionsForWeighting += row.sessions
    } else {
      ga4Map.set(row.page_path, {
        sessions: row.sessions,
        users: row.users,
        pageviews: row.pageviews,
        bounceRateWeighted: row.bounce_rate * row.sessions,
        avgSessionDurationWeighted: row.avg_session_duration * row.sessions,
        engagementRateWeighted: row.engagement_rate * row.sessions,
        totalSessionsForWeighting: row.sessions,
      })
    }
  }

  // 4. Fetch keyword rankings for all paths
  const { data: kwRows, error: kwError } = await supabase
    .from('keyword_rankings')
    .select('page, query, clicks')
    .eq('organization_id', orgId)
    .gte('date', dateRange.startDate)
    .lte('date', dateRange.endDate)

  if (kwError) {
    throw new Error(`Failed to fetch keyword rankings: ${kwError.message}`)
  }

  // Aggregate keywords by page path
  const kwMap = new Map<
    string,
    Map<string, number> // query → total clicks
  >()

  for (const row of kwRows ?? []) {
    // keyword_rankings.page stores full URLs from GSC
    const matchedPath = allPaths.find((p) => row.page.includes(p))
    if (!matchedPath) continue

    let queryMap = kwMap.get(matchedPath)
    if (!queryMap) {
      queryMap = new Map()
      kwMap.set(matchedPath, queryMap)
    }
    queryMap.set(row.query, (queryMap.get(row.query) ?? 0) + row.clicks)
  }

  // 5. Join content + GA4 + keywords
  const items: ContentPerformanceItem[] = allContent.map((content) => {
    const pagePath = buildPagePath(content.contentType, content.slug)
    const ga4 = ga4Map.get(pagePath)
    const kw = kwMap.get(pagePath)

    let topKeyword: string | null = null
    let keywordCount = 0

    if (kw && kw.size > 0) {
      keywordCount = kw.size
      let maxClicks = -1
      for (const [query, clicks] of kw) {
        if (clicks > maxClicks) {
          maxClicks = clicks
          topKeyword = query
        }
      }
    }

    const totalSessions = ga4?.totalSessionsForWeighting ?? 0

    return {
      id: content.id,
      title: content.title,
      slug: content.slug,
      contentType: content.contentType,
      seoScore: content.seo_score,
      publishedAt: content.published_at,
      sessions: ga4?.sessions ?? 0,
      users: ga4?.users ?? 0,
      pageviews: ga4?.pageviews ?? 0,
      bounceRate:
        totalSessions > 0 ? Math.round((ga4!.bounceRateWeighted / totalSessions) * 1000) / 1000 : 0,
      avgSessionDuration:
        totalSessions > 0 ? Math.round(ga4!.avgSessionDurationWeighted / totalSessions) : 0,
      engagementRate:
        totalSessions > 0
          ? Math.round((ga4!.engagementRateWeighted / totalSessions) * 1000) / 1000
          : 0,
      topKeyword,
      keywordCount,
    }
  })

  // 6. Sort
  items.sort((a, b) => {
    let cmp = 0
    switch (sort) {
      case 'title':
        cmp = a.title.localeCompare(b.title)
        break
      case 'seoScore':
        cmp = (a.seoScore ?? 0) - (b.seoScore ?? 0)
        break
      case 'sessions':
        cmp = a.sessions - b.sessions
        break
      case 'users':
        cmp = a.users - b.users
        break
      case 'pageviews':
        cmp = a.pageviews - b.pageviews
        break
      case 'bounceRate':
        cmp = a.bounceRate - b.bounceRate
        break
      case 'engagementRate':
        cmp = a.engagementRate - b.engagementRate
        break
      case 'publishedAt':
        cmp = (a.publishedAt ?? '').localeCompare(b.publishedAt ?? '')
        break
    }
    return order === 'desc' ? -cmp : cmp
  })

  // 7. Paginate
  const total = items.length
  const start = (page - 1) * pageSize
  const paginated = items.slice(start, start + pageSize)

  return { items: paginated, total, page, pageSize }
}
