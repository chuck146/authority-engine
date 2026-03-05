const GSC_API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3'
const GSC_SEARCH_ANALYTICS_URL = 'https://searchconsole.googleapis.com/webmasters/v3/sites'
const URL_INSPECTION_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

type FetchOptions = {
  accessToken: string
}

type SearchAnalyticsOptions = FetchOptions & {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions?: string[]
  rowLimit?: number
  startRow?: number
}

type GscApiRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

type SearchAnalyticsResponse = {
  rows?: GscApiRow[]
  responseAggregationType?: string
}

export async function fetchSearchAnalytics(
  options: SearchAnalyticsOptions,
): Promise<SearchAnalyticsResponse> {
  const { accessToken, siteUrl, startDate, endDate, dimensions, rowLimit, startRow } = options
  const encodedSite = encodeURIComponent(siteUrl)

  const body: Record<string, unknown> = {
    startDate,
    endDate,
    dimensions: dimensions ?? ['query'],
    rowLimit: rowLimit ?? 1000,
    startRow: startRow ?? 0,
  }

  const res = await fetch(`${GSC_SEARCH_ANALYTICS_URL}/${encodedSite}/searchAnalytics/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC Search Analytics API error (${res.status}): ${text}`)
  }

  return res.json()
}

type SitemapsResponse = {
  sitemap?: GscSitemapApiEntry[]
}

type GscSitemapApiEntry = {
  path: string
  lastSubmitted?: string
  isPending: boolean
  lastDownloaded?: string
  warnings: string
  errors: string
  contents?: { type: string; submitted: string; indexed: string }[]
}

export async function fetchSitemaps(
  options: FetchOptions & { siteUrl: string },
): Promise<GscSitemapApiEntry[]> {
  const encodedSite = encodeURIComponent(options.siteUrl)
  const res = await fetch(`${GSC_API_BASE}/sites/${encodedSite}/sitemaps`, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC Sitemaps API error (${res.status}): ${text}`)
  }

  const data: SitemapsResponse = await res.json()
  return data.sitemap ?? []
}

type UrlInspectionOptions = FetchOptions & {
  siteUrl: string
  inspectionUrl: string
}

export async function inspectUrl(options: UrlInspectionOptions): Promise<Record<string, unknown>> {
  const res = await fetch(URL_INSPECTION_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inspectionUrl: options.inspectionUrl,
      siteUrl: options.siteUrl,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC URL Inspection API error (${res.status}): ${text}`)
  }

  return res.json()
}

type SiteEntry = {
  siteUrl: string
  permissionLevel: string
}

type SitesResponse = {
  siteEntry?: SiteEntry[]
}

export async function listSites(options: FetchOptions): Promise<SiteEntry[]> {
  const res = await fetch(`${GSC_API_BASE}/sites`, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`GSC Sites API error (${res.status}): ${text}`)
  }

  const data: SitesResponse = await res.json()
  return data.siteEntry ?? []
}
