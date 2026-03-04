import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { calculateSeoScore, calculateSeoScoreValue } from '@/lib/seo'
import type { ContentType, Json } from '@/types'
import type { StructuredContent } from '@/types/content'
import type {
  SeoOverview,
  SeoContentItem,
  SeoScoreDistribution,
  SeoContentTypeSummary,
} from '@/types/seo'

type ContentRow = {
  id: string
  title: string
  slug: string
  status: string
  seo_score: number | null
  keywords: string[]
  content: Json
}

const TABLES = [
  { table: 'service_pages', contentType: 'service_page' as ContentType },
  { table: 'location_pages', contentType: 'location_page' as ContentType },
  { table: 'blog_posts', contentType: 'blog_post' as ContentType },
] as const

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const allItems: (ContentRow & { contentType: ContentType })[] = []

    // Fetch content from all 3 tables
    for (const { table, contentType } of TABLES) {
      const { data } = await supabase
        .from(table)
        .select('id, title, slug, status, seo_score, keywords, content')
        .eq('organization_id', auth.organizationId)
        .returns<ContentRow[]>()

      if (data) {
        allItems.push(...data.map((row) => ({ ...row, contentType })))
      }
    }

    // Compute scores for rows missing seo_score (seed data)
    const fireAndForgetUpdates: Promise<unknown>[] = []

    for (const item of allItems) {
      if (item.seo_score === null) {
        const score = calculateSeoScoreValue({
          content: item.content as unknown as StructuredContent,
          keywords: item.keywords ?? [],
          contentType: item.contentType,
        })
        item.seo_score = score

        // Fire-and-forget DB update
        const tableEntry = TABLES.find((t) => t.contentType === item.contentType)!
        fireAndForgetUpdates.push(
          Promise.resolve(
            supabase
              .from(tableEntry.table)
              .update({ seo_score: score } as never)
              .eq('id', item.id)
              .eq('organization_id', auth.organizationId),
          ),
        )
      }
    }

    // Don't await — fire and forget
    if (fireAndForgetUpdates.length > 0) {
      Promise.all(fireAndForgetUpdates).catch((err) =>
        console.error('[SEO] Failed to backfill scores:', err),
      )
    }

    // Build overview
    const scores = allItems.map((i) => i.seo_score!)
    const averageScore =
      scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

    const scoreDistribution: SeoScoreDistribution = {
      excellent: scores.filter((s) => s >= 80).length,
      good: scores.filter((s) => s >= 60 && s < 80).length,
      needsWork: scores.filter((s) => s >= 40 && s < 60).length,
      poor: scores.filter((s) => s < 40).length,
    }

    // Content by type
    const contentByType: SeoContentTypeSummary[] = TABLES.map(({ contentType }) => {
      const typeItems = allItems.filter((i) => i.contentType === contentType)
      const typeScores = typeItems.map((i) => i.seo_score!)
      return {
        contentType,
        count: typeItems.length,
        averageScore:
          typeScores.length > 0
            ? Math.round(typeScores.reduce((a, b) => a + b, 0) / typeScores.length)
            : 0,
      }
    })

    // Recent scores sorted worst-first, with top issue
    const recentScores: SeoContentItem[] = allItems
      .sort((a, b) => a.seo_score! - b.seo_score!)
      .slice(0, 20)
      .map((item) => {
        const result = calculateSeoScore({
          content: item.content as unknown as StructuredContent,
          keywords: item.keywords ?? [],
          contentType: item.contentType,
        })
        const worstRule = result.rules
          .filter((r) => !r.passed)
          .sort((a, b) => a.score - b.score)[0]

        return {
          id: item.id,
          contentType: item.contentType,
          title: item.title,
          slug: item.slug,
          status: item.status,
          seoScore: item.seo_score!,
          topIssue: worstRule?.recommendation ?? null,
        }
      })

    const overview: SeoOverview = {
      averageScore,
      totalPages: allItems.length,
      scoreDistribution,
      contentByType,
      recentScores,
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[SEO Overview Error]', err)
    return NextResponse.json({ error: 'Failed to fetch SEO overview' }, { status: 500 })
  }
}
