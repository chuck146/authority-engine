'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReviewDetailSheet } from './review-detail-sheet'
import type { ReviewListItem, ReviewPlatform } from '@/types/reviews'

const PLATFORM_LABELS: Record<ReviewPlatform, string> = {
  google: 'Google',
  yelp: 'Yelp',
  angi: "Angi's",
  manual: 'Manual',
}

const PLATFORM_COLORS: Record<ReviewPlatform, string> = {
  google: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  yelp: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  angi: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  manual: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  draft: 'outline',
  review: 'secondary',
  approved: 'default',
  sent: 'default',
  archived: 'destructive',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}
        >
          ★
        </span>
      ))}
    </span>
  )
}

type ReviewListProps = {
  platform?: ReviewPlatform
}

export function ReviewList({ platform }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function fetchReviews() {
    const params = new URLSearchParams()
    if (platform) params.set('platform', platform)

    fetch(`/api/v1/reviews?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reviews')
        return res.json()
      })
      .then((data) => setReviews(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform])

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-muted h-16 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No reviews yet. Go to the Add Review tab to enter one manually.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{platform ? `${PLATFORM_LABELS[platform]} Reviews` : 'All Reviews'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {reviews.map((review) => (
              <button
                key={review.id}
                type="button"
                onClick={() => setSelectedId(review.id)}
                className="hover:bg-muted/50 flex w-full items-center gap-4 px-2 py-3 text-left transition-colors"
              >
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PLATFORM_COLORS[review.platform]}`}
                >
                  {PLATFORM_LABELS[review.platform]}
                </span>
                <StarRating rating={review.rating} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{review.reviewerName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {review.reviewText?.slice(0, 120) ?? '(No text)'}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[review.responseStatus] ?? 'outline'}>
                  {review.responseStatus}
                </Badge>
                <span className="text-muted-foreground text-xs whitespace-nowrap">
                  {new Date(review.reviewDate).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ReviewDetailSheet
        reviewId={selectedId}
        onClose={() => setSelectedId(null)}
        onStatusChange={fetchReviews}
      />
    </>
  )
}
