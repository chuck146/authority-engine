'use client'

import { useEffect, useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ReviewResponseForm } from './review-response-form'
import type { ReviewDetail } from '@/types/reviews'

type ReviewDetailSheetProps = {
  reviewId: string | null
  onClose: () => void
  onStatusChange?: () => void
}

const PLATFORM_NAMES: Record<string, string> = {
  google: 'Google',
  yelp: 'Yelp',
  angi: "Angi's",
  manual: 'Manual',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  mixed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-lg" aria-label={`${rating} out of 5 stars`}>
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

export function ReviewDetailSheet({ reviewId, onClose, onStatusChange }: ReviewDetailSheetProps) {
  const [review, setReview] = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editingResponse, setEditingResponse] = useState(false)
  const [editedResponseText, setEditedResponseText] = useState('')
  const [postingReply, setPostingReply] = useState(false)

  useEffect(() => {
    if (!reviewId) {
      setReview(null)
      return
    }

    setLoading(true)
    fetch(`/api/v1/reviews/${reviewId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load review')
        return res.json()
      })
      .then((data) => setReview(data))
      .catch(() => setReview(null))
      .finally(() => setLoading(false))
  }, [reviewId])

  async function handleAction(action: string) {
    if (!review) return
    setActionLoading(true)

    try {
      const res = await fetch(`/api/v1/reviews/${review.id}/response-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Action failed')
      }

      const result = await res.json()
      setReview((prev) => (prev ? { ...prev, responseStatus: result.responseStatus } : null))
      onStatusChange?.()
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCopyResponse() {
    if (!review?.responseText) return
    await navigator.clipboard.writeText(review.responseText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveEdit() {
    if (!review) return
    setActionLoading(true)

    try {
      const res = await fetch(`/api/v1/reviews/${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText: editedResponseText }),
      })

      if (!res.ok) throw new Error('Failed to save')

      const updated = await res.json()
      setReview(updated)
      setEditingResponse(false)
      onStatusChange?.()
    } catch {
      // silently fail
    } finally {
      setActionLoading(false)
    }
  }

  async function handlePostToGoogle() {
    if (!review) return
    setPostingReply(true)
    try {
      const res = await fetch(`/api/v1/reviews/${review.id}/post-reply`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to post reply')
      }
      const result = await res.json()
      setReview((prev) => (prev ? { ...prev, responseStatus: result.responseStatus } : null))
      onStatusChange?.()
    } catch {
      // silently fail
    } finally {
      setPostingReply(false)
    }
  }

  function handleResponseGenerated() {
    // Re-fetch the review to get updated response
    if (!reviewId) return
    fetch(`/api/v1/reviews/${reviewId}`)
      .then((res) => res.json())
      .then((data) => setReview(data))
    onStatusChange?.()
  }

  return (
    <Sheet open={!!reviewId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {review ? `${PLATFORM_NAMES[review.platform]} Review` : 'Review Detail'}
          </SheetTitle>
          <SheetDescription>
            {review && (
              <span className="flex items-center gap-2">
                <Badge variant={review.responseStatus === 'sent' ? 'default' : 'secondary'}>
                  {review.responseStatus}
                </Badge>
                {review.sentiment && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SENTIMENT_COLORS[review.sentiment]}`}
                  >
                    {review.sentiment}
                  </span>
                )}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="space-y-3 pt-4">
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-20 animate-pulse rounded" />
          </div>
        )}

        {review && !loading && (
          <div className="space-y-6 pt-4">
            {/* Review Info */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{review.reviewerName}</p>
                <StarRating rating={review.rating} />
              </div>
              {review.reviewText && (
                <p className="text-sm whitespace-pre-wrap">{review.reviewText}</p>
              )}
              {!review.reviewText && (
                <p className="text-muted-foreground text-sm italic">
                  Rating only — no text provided
                </p>
              )}
            </div>

            {/* Response Section */}
            <div className="border-t pt-4">
              <h4 className="mb-2 text-sm font-medium">Response</h4>

              {review.responseText && !editingResponse && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm whitespace-pre-wrap">{review.responseText}</p>
                </div>
              )}

              {editingResponse && (
                <div className="space-y-2">
                  <Textarea
                    value={editedResponseText}
                    onChange={(e) => setEditedResponseText(e.target.value)}
                    rows={6}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={actionLoading}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingResponse(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!review.responseText &&
                !editingResponse &&
                ['pending', 'draft'].includes(review.responseStatus) && (
                  <ReviewResponseForm reviewId={review.id} onGenerated={handleResponseGenerated} />
                )}
            </div>

            {/* Key Themes */}
            {Array.isArray(review.metadata?.key_themes) &&
            (review.metadata.key_themes as string[]).length > 0 ? (
              <div>
                <h4 className="mb-2 text-sm font-medium">Key Themes</h4>
                <div className="flex flex-wrap gap-1">
                  {(review.metadata.key_themes as string[]).map((theme) => (
                    <span
                      key={theme}
                      className="bg-muted inline-flex rounded-full px-2 py-0.5 text-xs"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Meta */}
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>Review Date: {new Date(review.reviewDate).toLocaleDateString()}</p>
              {review.responseGeneratedAt && (
                <p>Response Generated: {new Date(review.responseGeneratedAt).toLocaleString()}</p>
              )}
              {review.responseApprovedAt && (
                <p>Approved: {new Date(review.responseApprovedAt).toLocaleString()}</p>
              )}
              {review.responseSentAt && (
                <p>Sent: {new Date(review.responseSentAt).toLocaleString()}</p>
              )}
              {review.reviewerProfileUrl && (
                <p>
                  Profile:{' '}
                  <a
                    href={review.reviewerProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    View
                  </a>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {review.responseText && (
                <Button variant="outline" onClick={handleCopyResponse}>
                  {copied ? 'Copied!' : 'Copy Response'}
                </Button>
              )}

              {review.responseText &&
                ['pending', 'draft', 'review'].includes(review.responseStatus) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedResponseText(review.responseText ?? '')
                      setEditingResponse(true)
                    }}
                  >
                    Edit Response
                  </Button>
                )}

              {review.responseStatus === 'draft' && (
                <Button onClick={() => handleAction('submit_for_review')} disabled={actionLoading}>
                  Submit for Review
                </Button>
              )}

              {review.responseStatus === 'review' && (
                <>
                  <Button onClick={() => handleAction('approve')} disabled={actionLoading}>
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                  >
                    Reject
                  </Button>
                </>
              )}

              {review.responseStatus === 'approved' && review.platform === 'google' && (
                <Button onClick={handlePostToGoogle} disabled={postingReply || actionLoading}>
                  {postingReply ? 'Posting...' : 'Post to Google'}
                </Button>
              )}

              {review.responseStatus === 'approved' && review.platform !== 'google' && (
                <Button onClick={() => handleAction('mark_sent')} disabled={actionLoading}>
                  Mark as Sent
                </Button>
              )}

              {['pending', 'draft', 'review', 'approved', 'sent'].includes(
                review.responseStatus,
              ) && (
                <Button
                  variant="outline"
                  onClick={() => handleAction('archive')}
                  disabled={actionLoading}
                >
                  Archive
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
