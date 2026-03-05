'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReviewOverview } from '@/types/reviews'

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-lg" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < Math.round(rating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'
          }
        >
          ★
        </span>
      ))}
    </span>
  )
}

export function ReviewOverviewCards() {
  const [overview, setOverview] = useState<ReviewOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/reviews/overview')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load overview')
        return res.json()
      })
      .then((data) => setOverview(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="bg-muted h-16 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error ?? 'Failed to load overview'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.totalReviews}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{overview.averageRating.toFixed(1)}</p>
              <StarRating rating={overview.averageRating} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Pending Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.pendingResponses}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              5-Star Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.ratingDistribution[5] ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = overview.ratingDistribution[stars] ?? 0
              const percentage =
                overview.totalReviews > 0 ? (count / overview.totalReviews) * 100 : 0
              return (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-16 text-sm">{stars} stars</span>
                  <div className="bg-muted h-4 flex-1 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-yellow-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground w-10 text-right text-sm">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      {overview.platformBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {overview.platformBreakdown.map((pb) => (
                <div key={pb.platform} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium capitalize">{pb.platform}</span>
                  <span className="text-muted-foreground text-sm">
                    {pb.count} reviews ({pb.avgRating.toFixed(1)} avg)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sentiment Breakdown */}
      {overview.sentimentBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {overview.sentimentBreakdown.map((sb) => (
                <div key={sb.sentiment} className="bg-muted rounded-lg px-4 py-2 text-center">
                  <p className="text-lg font-bold">{sb.count}</p>
                  <p className="text-muted-foreground text-xs capitalize">{sb.sentiment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
