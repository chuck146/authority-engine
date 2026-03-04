import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { inspectUrl } from '@/lib/google/search-console'
import { urlInspectionSchema } from '@/types/gsc'
import type { UrlInspectionResult } from '@/types/gsc'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth()
    const { accessToken, siteUrl } = await getValidToken(auth.organizationId)

    const body = await request.json()
    const parsed = urlInspectionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const raw = await inspectUrl({
      accessToken,
      siteUrl,
      inspectionUrl: parsed.data.url,
    })

    // Map Google's nested response to our flat type
    const inspection = raw.inspectionResult as Record<string, unknown> | undefined
    const indexStatus = inspection?.indexStatusResult as Record<string, unknown> | undefined
    const mobileResult = inspection?.mobileUsabilityResult as Record<string, unknown> | undefined
    const richResultsResult = inspection?.richResultsResult as Record<string, unknown> | undefined

    const result: UrlInspectionResult = {
      inspectionUrl: parsed.data.url,
      indexingState: (indexStatus?.indexingState as UrlInspectionResult['indexingState']) ?? 'UNKNOWN',
      coverageState: (indexStatus?.coverageState as string) ?? 'URL_IS_UNKNOWN',
      lastCrawlTime: (indexStatus?.lastCrawlTime as string) ?? null,
      crawlAllowed: (indexStatus?.crawledAs as string) !== 'CRAWLED_AS_NONE',
      robotsTxtState: (indexStatus?.robotsTxtState as UrlInspectionResult['robotsTxtState']) ?? 'UNKNOWN',
      pageFetchState: (indexStatus?.pageFetchState as string) ?? 'UNKNOWN',
      mobileUsability: (mobileResult?.verdict as UrlInspectionResult['mobileUsability']) ?? 'UNKNOWN',
      richResults: Array.isArray(richResultsResult?.detectedItems)
        ? (richResultsResult.detectedItems as { richResultType: string; items: { name: string; issues: string[] }[] }[])
        : [],
    }

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GSC URL Inspection Error]', err)
    return NextResponse.json({ error: 'Failed to inspect URL' }, { status: 500 })
  }
}
