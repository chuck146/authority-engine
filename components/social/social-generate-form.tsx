'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SocialPlatform } from '@/types/social'

type SocialGenerateFormProps = {
  onGenerated?: () => void
}

export function SocialGenerateForm({ onGenerated }: SocialGenerateFormProps) {
  const [platform, setPlatform] = useState<SocialPlatform>('gbp')
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState<'professional' | 'friendly' | 'authoritative'>('professional')
  const [generateImage, setGenerateImage] = useState(false)
  const [keywords, setKeywords] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // GBP-specific
  const [postType, setPostType] = useState<'update' | 'event' | 'offer'>('update')
  const [ctaType, setCtaType] = useState<string>('')
  const [ctaUrl, setCtaUrl] = useState('')

  // Instagram-specific
  const [mood, setMood] = useState<
    'inspiring' | 'educational' | 'promotional' | 'behind-the-scenes'
  >('inspiring')
  const [hashtagCount, setHashtagCount] = useState(15)

  // Facebook-specific
  const [linkUrl, setLinkUrl] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const keywordsArray = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)

    let body: Record<string, unknown> = {
      platform,
      topic,
      tone,
      generateImage,
      keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
    }

    if (platform === 'gbp') {
      body = { ...body, postType, ctaType: ctaType || undefined, ctaUrl: ctaUrl || undefined }
    } else if (platform === 'instagram') {
      body = { ...body, mood, hashtagCount }
    } else if (platform === 'facebook') {
      body = { ...body, linkUrl: linkUrl || undefined }
    }

    try {
      const res = await fetch('/api/v1/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate post')
      }

      setSuccess(true)
      setTopic('')
      setKeywords('')
      onGenerated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Social Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gbp">Google Business Profile</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="topic">Topic / Message</Label>
            <Input
              id="topic"
              placeholder="e.g., Spring painting special, project showcase, color trends..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
              minLength={3}
              maxLength={300}
            />
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
              <SelectTrigger id="tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="authoritative">Authoritative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* GBP-specific fields */}
          {platform === 'gbp' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="postType">Post Type</Label>
                <Select value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
                  <SelectTrigger id="postType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaType">CTA Type (optional)</Label>
                <Select value={ctaType} onValueChange={setCtaType}>
                  <SelectTrigger id="ctaType">
                    <SelectValue placeholder="Select CTA type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOOK">Book</SelectItem>
                    <SelectItem value="ORDER">Order</SelectItem>
                    <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                    <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                    <SelectItem value="CALL">Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {ctaType && (
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">CTA URL</Label>
                  <Input
                    id="ctaUrl"
                    type="url"
                    placeholder="https://..."
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {/* Instagram-specific fields */}
          {platform === 'instagram' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="mood">Mood / Style</Label>
                <Select value={mood} onValueChange={(v) => setMood(v as typeof mood)}>
                  <SelectTrigger id="mood">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspiring">Inspiring</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                    <SelectItem value="behind-the-scenes">Behind the Scenes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hashtagCount">Hashtag Count</Label>
                <Input
                  id="hashtagCount"
                  type="number"
                  min={5}
                  max={30}
                  value={hashtagCount}
                  onChange={(e) => setHashtagCount(Number(e.target.value))}
                />
              </div>
            </>
          )}

          {/* Facebook-specific fields */}
          {platform === 'facebook' && (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">Link URL (optional)</Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
          )}

          {/* Keywords */}
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords (comma-separated, optional)</Label>
            <Input
              id="keywords"
              placeholder="painting, home improvement, NJ"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          {/* Generate Image Toggle */}
          <div className="flex items-center space-x-2">
            <input
              id="generateImage"
              type="checkbox"
              checked={generateImage}
              onChange={(e) => setGenerateImage(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="generateImage" className="text-sm font-normal">
              Generate accompanying image (Nano Banana 2)
            </Label>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/50 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/20 dark:text-green-400">
              Post generated successfully! Check the post list to review it.
            </div>
          )}

          {/* Submit */}
          <Button type="submit" disabled={loading || !topic.trim()}>
            {loading ? 'Generating...' : 'Generate Post'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
