import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import type {
  ReviewOverview,
  ReviewListItem,
  ReviewPlatform,
  ReviewResponseStatus,
  ReviewSentiment,
} from '@/types/reviews'

type ReviewRow = {
  id: string
  platform: string
  reviewer_name: string
  rating: number
  review_text: string | null
  review_date: string
  response_status: string
  sentiment: string | null
  created_at: string
}

// GET /api/v1/reviews/overview
export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    // Fetch all reviews for this org
    const { data: reviews, error } = await supabase
      .from('reviews' as never)
      .select(
        'id, platform, reviewer_name, rating, review_text, review_date, response_status, sentiment, created_at',
      )
      .eq('organization_id', auth.organizationId)
      .order('review_date', { ascending: false })
      .returns<ReviewRow[]>()

    if (error) throw error

    const allReviews = reviews ?? []
    const totalReviews = allReviews.length

    // Average rating
    const averageRating =
      totalReviews > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10
        : 0

    // Rating distribution
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    for (const r of allReviews) {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] ?? 0) + 1
    }

    // Pending responses
    const pendingResponses = allReviews.filter((r) => r.response_status === 'pending').length

    // Platform breakdown
    const platformMap = new Map<string, { count: number; totalRating: number }>()
    for (const r of allReviews) {
      const existing = platformMap.get(r.platform) ?? { count: 0, totalRating: 0 }
      existing.count++
      existing.totalRating += r.rating
      platformMap.set(r.platform, existing)
    }
    const platformBreakdown = Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform: platform as ReviewPlatform,
      count: data.count,
      avgRating: Math.round((data.totalRating / data.count) * 10) / 10,
    }))

    // Sentiment breakdown
    const sentimentMap = new Map<string, number>()
    for (const r of allReviews) {
      if (r.sentiment) {
        sentimentMap.set(r.sentiment, (sentimentMap.get(r.sentiment) ?? 0) + 1)
      }
    }
    const sentimentBreakdown = Array.from(sentimentMap.entries()).map(([sentiment, count]) => ({
      sentiment: sentiment as ReviewSentiment,
      count,
    }))

    // Recent reviews (top 10)
    const recentReviews: ReviewListItem[] = allReviews.slice(0, 10).map((row) => ({
      id: row.id,
      platform: row.platform as ReviewPlatform,
      reviewerName: row.reviewer_name,
      rating: row.rating,
      reviewText: row.review_text,
      reviewDate: row.review_date,
      responseStatus: row.response_status as ReviewResponseStatus,
      sentiment: (row.sentiment as ReviewSentiment) ?? null,
      createdAt: row.created_at,
    }))

    const overview: ReviewOverview = {
      totalReviews,
      averageRating,
      ratingDistribution,
      pendingResponses,
      platformBreakdown,
      sentimentBreakdown,
      recentReviews,
    }

    return NextResponse.json(overview)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Reviews Overview Error]', err)
    return NextResponse.json({ error: 'Failed to load reviews overview' }, { status: 500 })
  }
}
