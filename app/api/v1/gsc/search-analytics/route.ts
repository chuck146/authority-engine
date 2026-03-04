import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { fetchSearchAnalytics } from '@/lib/google/search-console'
import { searchAnalyticsQuerySchema } from '@/types/gsc'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    const { accessToken, siteUrl } = await getValidToken(auth.organizationId)

    const params = Object.fromEntries(request.nextUrl.searchParams.entries())
    // dimensions can be comma-separated
    const raw = {
      ...params,
      dimensions: params.dimensions ? params.dimensions.split(',') : undefined,
    }
    const parsed = searchAnalyticsQuerySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { startDate, endDate, dimensions, rowLimit, startRow } = parsed.data
    const result = await fetchSearchAnalytics({
      accessToken,
      siteUrl,
      startDate,
      endDate,
      dimensions,
      rowLimit,
      startRow,
    })

    const rows = (result.rows ?? []).map((r) => ({
      keys: r.keys,
      clicks: r.clicks,
      impressions: r.impressions,
      ctr: Math.round(r.ctr * 1000) / 1000,
      position: Math.round(r.position * 10) / 10,
    }))

    return NextResponse.json({ rows, totalRows: rows.length })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GSC Search Analytics Error]', err)
    return NextResponse.json({ error: 'Failed to fetch search analytics' }, { status: 500 })
  }
}
