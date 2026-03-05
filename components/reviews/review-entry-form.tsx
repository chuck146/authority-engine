'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReviewPlatform } from '@/types/reviews'

type ReviewEntryFormProps = {
  onCreated?: () => void
}

export function ReviewEntryForm({ onCreated }: ReviewEntryFormProps) {
  const [platform, setPlatform] = useState<ReviewPlatform>('google')
  const [reviewerName, setReviewerName] = useState('')
  const [rating, setRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          reviewerName,
          rating,
          reviewText: reviewText || undefined,
          reviewDate: new Date(reviewDate).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create review')
      }

      setSuccess(true)
      setReviewerName('')
      setRating(5)
      setReviewText('')
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Review Manually</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="review-platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as ReviewPlatform)}>
              <SelectTrigger id="review-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
                <SelectItem value="angi">Angi&apos;s</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reviewer Name */}
          <div className="space-y-2">
            <Label htmlFor="reviewer-name">Reviewer Name</Label>
            <Input
              id="reviewer-name"
              placeholder="John Smith"
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              required
              minLength={1}
              maxLength={200}
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl transition-colors ${
                    star <= rating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-yellow-300 dark:text-gray-600'
                  }`}
                  aria-label={`${star} stars`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review-text">Review Text (optional)</Label>
            <Textarea
              id="review-text"
              placeholder="What the customer wrote..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              maxLength={5000}
            />
          </div>

          {/* Review Date */}
          <div className="space-y-2">
            <Label htmlFor="review-date">Review Date</Label>
            <Input
              id="review-date"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
              required
            />
          </div>

          {/* Error / Success */}
          {error && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
              Review added successfully! Check the review list to see it.
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={loading || !reviewerName.trim()}>
            {loading ? 'Adding...' : 'Add Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
