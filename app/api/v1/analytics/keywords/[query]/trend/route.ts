import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { resolveDateRange } from '@/lib/analytics/date-range'
import { getKeywordTrend } from '@/lib/analytics/keyword-rankings'
import { analyticsKeywordTrendQuerySchema } from '@/types/analytics'
import type { DateRangePreset } from '@/types/analytics'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> },
) {
  try {
    const auth = await requireApiAuth()
    const { query } = await params
    const decodedQuery = decodeURIComponent(query)

    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const parsed = analyticsKeywordTrendQuerySchema.safeParse(searchParams)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { range, startDate, endDate } = parsed.data
    const resolved = resolveDateRange(range as DateRangePreset, startDate, endDate)

    const supabase = await createClient()
    const trend = await getKeywordTrend(supabase, auth.organizationId, decodedQuery, resolved.current)

    return NextResponse.json(trend)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Analytics Keyword Trend Error]', err)
    return NextResponse.json({ error: 'Failed to fetch keyword trend' }, { status: 500 })
  }
}
