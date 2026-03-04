import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type { ContentType } from '@/types/content'
import type {
  DashboardMetrics,
  HeroMetrics,
  ContentPipeline,
  StatusBreakdown,
  ContentTypeBreakdown,
  RecentActivityItem,
} from '@/types/dashboard'

type ContentRow = {
  id: string
  title: string
  slug: string
  status: string
  seo_score: number | null
  published_at: string | null
}

const TABLES = [
  { table: 'service_pages', contentType: 'service_page' as ContentType, label: 'Service Pages' },
  { table: 'location_pages', contentType: 'location_page' as ContentType, label: 'Location Pages' },
  { table: 'blog_posts', contentType: 'blog_post' as ContentType, label: 'Blog Posts' },
] as const

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    // Parallel: fetch all 3 content tables + next scheduled calendar entry
    const [serviceRes, locationRes, blogRes, calendarRes] = await Promise.all([
      supabase
        .from('service_pages')
        .select('id, title, slug, status, seo_score, published_at')
        .eq('organization_id', auth.organizationId)
        .returns<ContentRow[]>(),
      supabase
        .from('location_pages')
        .select('id, title, slug, status, seo_score, published_at')
        .eq('organization_id', auth.organizationId)
        .returns<ContentRow[]>(),
      supabase
        .from('blog_posts')
        .select('id, title, slug, status, seo_score, published_at')
        .eq('organization_id', auth.organizationId)
        .returns<ContentRow[]>(),
      supabase
        .from('content_calendar')
        .select('scheduled_at')
        .eq('organization_id', auth.organizationId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .returns<{ scheduled_at: string }[]>(),
    ])

    // Merge all content rows with their type
    const allItems: (ContentRow & { contentType: ContentType })[] = []
    const results = [
      { data: serviceRes.data, contentType: TABLES[0].contentType },
      { data: locationRes.data, contentType: TABLES[1].contentType },
      { data: blogRes.data, contentType: TABLES[2].contentType },
    ] as const

    for (const { data, contentType } of results) {
      if (data) {
        allItems.push(...data.map((row) => ({ ...row, contentType })))
      }
    }

    // --- Hero Metrics ---
    const publishedItems = allItems.filter((i) => i.status === 'published')
    const publishedScores = publishedItems
      .map((i) => i.seo_score)
      .filter((s): s is number => s !== null)
    const averageSeoScore =
      publishedScores.length > 0
        ? Math.round(publishedScores.reduce((a, b) => a + b, 0) / publishedScores.length)
        : 0

    const hero: HeroMetrics = {
      totalPublished: publishedItems.length,
      averageSeoScore,
      contentInReview: allItems.filter((i) => i.status === 'review').length,
      nextScheduledPublish: calendarRes.data?.[0]?.scheduled_at ?? null,
    }

    // --- Content Pipeline ---
    const statusBreakdown: StatusBreakdown = {
      draft: 0,
      review: 0,
      approved: 0,
      published: 0,
      archived: 0,
    }
    for (const item of allItems) {
      const status = item.status as keyof StatusBreakdown
      if (status in statusBreakdown && statusBreakdown[status] !== undefined) {
        statusBreakdown[status]++
      }
    }

    const byType: ContentTypeBreakdown[] = TABLES.map(({ contentType, label }) => {
      const typeItems = allItems.filter((i) => i.contentType === contentType)
      return {
        contentType,
        label,
        total: typeItems.length,
        published: typeItems.filter((i) => i.status === 'published').length,
      }
    })

    const pipeline: ContentPipeline = {
      statusBreakdown,
      totalContent: allItems.length,
      byType,
    }

    // --- Recent Activity (8 most recently published) ---
    const recentActivity: RecentActivityItem[] = publishedItems
      .filter((i) => i.published_at !== null)
      .sort(
        (a, b) =>
          new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime(),
      )
      .slice(0, 8)
      .map((item) => ({
        id: item.id,
        contentType: item.contentType,
        title: item.title,
        slug: item.slug,
        status: item.status,
        publishedAt: item.published_at!,
      }))

    const metrics: DashboardMetrics = { hero, pipeline, recentActivity }

    return NextResponse.json(metrics)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Dashboard Error]', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 })
  }
}
