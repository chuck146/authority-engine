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
import type { ReviewRequestPlatform } from '@/types/review-requests'

type ReviewRequestFormProps = {
  onCreated?: () => void
}

export function ReviewRequestForm({ onCreated }: ReviewRequestFormProps) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [reviewPlatform, setReviewPlatform] = useState<ReviewRequestPlatform>('google')
  const [reviewUrl, setReviewUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/v1/reviews/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerPhone: customerPhone || undefined,
          channel: 'sms',
          reviewPlatform,
          reviewUrl,
          message: message || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create review request')
      }

      setSuccess(true)
      setCustomerName('')
      setCustomerPhone('')
      setReviewUrl('')
      setMessage('')
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
        <CardTitle>Send Review Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="rr-customer-name">Customer Name</Label>
            <Input
              id="rr-customer-name"
              placeholder="John Smith"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              minLength={1}
              maxLength={200}
            />
          </div>

          {/* Customer Phone */}
          <div className="space-y-2">
            <Label htmlFor="rr-customer-phone">Phone Number</Label>
            <Input
              id="rr-customer-phone"
              type="tel"
              placeholder="+1 (201) 555-1234"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              US format. Used to send SMS review request.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="rr-platform">Review Platform</Label>
            <Select
              value={reviewPlatform}
              onValueChange={(v) => setReviewPlatform(v as ReviewRequestPlatform)}
            >
              <SelectTrigger id="rr-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="yelp">Yelp</SelectItem>
                <SelectItem value="angi">Angi&apos;s</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Review URL */}
          <div className="space-y-2">
            <Label htmlFor="rr-review-url">Review URL</Label>
            <Input
              id="rr-review-url"
              type="url"
              placeholder="https://g.page/r/your-business/review"
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              required
            />
            <p className="text-muted-foreground text-xs">
              Direct link where the customer can leave a review.
            </p>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="rr-message">Custom Message (optional)</Label>
            <Textarea
              id="rr-message"
              placeholder="Use {name}, {org}, {url} as variables..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={320}
            />
            <p className="text-muted-foreground text-xs">
              Leave blank for default message. Max 320 characters.
            </p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
              Review request created! Go to the Request Reviews tab to send it.
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={loading || !customerName.trim() || !reviewUrl.trim()}>
            {loading ? 'Creating...' : 'Create Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
