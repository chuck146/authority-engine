'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VideoGenerationStatus } from './video-generation-status'
import type { VideoType, VideoEngine, VideoLibraryItem } from '@/types/video'

type VideoGenerateFormProps = {
  onJobComplete: (item: VideoLibraryItem) => void
}

const VEO_TYPE_LABELS: Record<string, string> = {
  cinematic_reel: 'Cinematic Reel',
  project_showcase: 'Project Showcase',
  testimonial_scene: 'Testimonial Scene',
  brand_story: 'Brand Story',
}

const REMOTION_TYPE_LABELS: Record<string, string> = {
  testimonial_quote: 'Testimonial Quote',
  tip_video: 'Tip Video',
  before_after_reveal: 'Before/After Reveal',
  branded_intro: 'Branded Intro',
  branded_outro: 'Branded Outro',
}

export const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  ...VEO_TYPE_LABELS,
  ...REMOTION_TYPE_LABELS,
} as Record<VideoType, string>

export function VideoGenerateForm({ onJobComplete }: VideoGenerateFormProps) {
  const [engine, setEngine] = useState<VideoEngine>('remotion')
  const [videoType, setVideoType] = useState<string>('testimonial_quote')
  const [model, setModel] = useState('veo-3.1-fast-generate-preview')
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Veo fields
  const [sceneDescription, setSceneDescription] = useState('')
  const [audioMood, setAudioMood] = useState('')
  const [aspectRatio, setAspectRatio] = useState('9:16')
  const [beforeDescription, setBeforeDescription] = useState('')
  const [afterDescription, setAfterDescription] = useState('')
  const [location, setLocation] = useState('')
  const [quote, setQuote] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [sentiment, setSentiment] = useState('positive')
  const [narrative, setNarrative] = useState('')
  const [style, setStyle] = useState('cinematic')

  // Remotion fields
  const [tipTitle, setTipTitle] = useState('')
  const [tips, setTips] = useState([{ number: 1, text: '' }])
  const [starRating, setStarRating] = useState(5)
  const [beforeImageUrl, setBeforeImageUrl] = useState('')
  const [afterImageUrl, setAfterImageUrl] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')

  const handleEngineChange = (newEngine: VideoEngine) => {
    setEngine(newEngine)
    if (newEngine === 'veo') {
      setVideoType('cinematic_reel')
    } else {
      setVideoType('testimonial_quote')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setGenerating(true)

    try {
      const body = buildRequestBody()
      const res = await fetch('/api/v1/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to start video generation')
        setGenerating(false)
        return
      }

      const data = await res.json()
      setJobId(data.jobId)
    } catch {
      setError('Network error. Please try again.')
      setGenerating(false)
    }
  }

  const buildRequestBody = (): Record<string, unknown> => {
    if (engine === 'veo') {
      const base = { videoType, model }
      switch (videoType) {
        case 'cinematic_reel':
          return { ...base, sceneDescription, audioMood, aspectRatio }
        case 'project_showcase':
          return { ...base, beforeDescription, afterDescription, location }
        case 'testimonial_scene':
          return { ...base, quote, customerName, sentiment }
        case 'brand_story':
          return { ...base, narrative, style }
        default:
          return base
      }
    }

    // Remotion
    switch (videoType) {
      case 'testimonial_quote':
        return { videoType, quote, customerName, starRating }
      case 'tip_video':
        return { videoType, title: tipTitle, tips }
      case 'before_after_reveal':
        return {
          videoType,
          beforeImageUrl,
          afterImageUrl,
          ...(location ? { location } : {}),
        }
      case 'branded_intro':
        return { videoType }
      case 'branded_outro':
        return {
          videoType,
          ...(ctaText ? { ctaText } : {}),
          ...(ctaUrl ? { ctaUrl } : {}),
        }
      default:
        return { videoType }
    }
  }

  const handleJobDone = (item: VideoLibraryItem) => {
    setJobId(null)
    setGenerating(false)
    onJobComplete(item)
  }

  const handleJobError = (msg: string) => {
    setJobId(null)
    setGenerating(false)
    setError(msg)
  }

  const addTip = () => {
    if (tips.length < 7) {
      setTips([...tips, { number: tips.length + 1, text: '' }])
    }
  }

  const updateTipText = (index: number, text: string) => {
    setTips(tips.map((t, i) => (i === index ? { ...t, text } : t)))
  }

  const removeTip = (index: number) => {
    if (tips.length > 1) {
      setTips(tips.filter((_, i) => i !== index).map((t, i) => ({ ...t, number: i + 1 })))
    }
  }

  if (jobId) {
    return (
      <VideoGenerationStatus jobId={jobId} onComplete={handleJobDone} onError={handleJobError} />
    )
  }

  const typeLabels = engine === 'veo' ? VEO_TYPE_LABELS : REMOTION_TYPE_LABELS

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Video</CardTitle>
        <CardDescription>
          {engine === 'veo'
            ? 'Create AI-powered cinematic video content using Veo 3.1.'
            : 'Create branded motion graphics using Remotion.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Engine selector */}
          <div className="space-y-2">
            <Label>Engine</Label>
            <Select value={engine} onValueChange={(v) => handleEngineChange(v as VideoEngine)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remotion">Remotion (Motion Graphics)</SelectItem>
                <SelectItem value="veo">Veo 3.1 (Cinematic AI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={engine === 'veo' ? 'grid grid-cols-2 gap-4' : ''}>
            <div className="space-y-2">
              <Label htmlFor="videoType">Video Type</Label>
              <Select value={videoType} onValueChange={setVideoType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {engine === 'veo' && (
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veo-3.1-fast-generate-preview">
                      Veo 3.1 Fast ($0.15/sec)
                    </SelectItem>
                    <SelectItem value="veo-3.1-generate-preview">
                      Veo 3.1 Standard ($0.40/sec)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* --- Veo fields --- */}
          {engine === 'veo' && videoType === 'cinematic_reel' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="sceneDescription">Scene Description</Label>
                <Textarea
                  id="sceneDescription"
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder="Describe the visual scene in detail..."
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audioMood">Audio Mood</Label>
                  <Input
                    id="audioMood"
                    value={audioMood}
                    onChange={(e) => setAudioMood(e.target.value)}
                    placeholder="Warm, uplifting orchestral..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">9:16 (Reels/Shorts)</SelectItem>
                      <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {engine === 'veo' && videoType === 'project_showcase' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="beforeDescription">Before Description</Label>
                <Textarea
                  id="beforeDescription"
                  value={beforeDescription}
                  onChange={(e) => setBeforeDescription(e.target.value)}
                  placeholder="Describe the 'before' state..."
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="afterDescription">After Description</Label>
                <Textarea
                  id="afterDescription"
                  value={afterDescription}
                  onChange={(e) => setAfterDescription(e.target.value)}
                  placeholder="Describe the 'after' state..."
                  rows={3}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Summit, NJ"
                  required
                />
              </div>
            </>
          )}

          {engine === 'veo' && videoType === 'testimonial_scene' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="quote">Customer Quote</Label>
                <Textarea
                  id="quote"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="The customer's testimonial..."
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sentiment">Sentiment</Label>
                  <Select value={sentiment} onValueChange={setSentiment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="grateful">Grateful</SelectItem>
                      <SelectItem value="impressed">Impressed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {engine === 'veo' && videoType === 'brand_story' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="narrative">Narrative</Label>
                <Textarea
                  id="narrative"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Tell the brand story..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* --- Remotion fields --- */}
          {engine === 'remotion' && videoType === 'testimonial_quote' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="rQuote">Customer Quote</Label>
                <Textarea
                  id="rQuote"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="The customer's testimonial quote..."
                  rows={3}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rCustomerName">Customer Name</Label>
                  <Input
                    id="rCustomerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Sarah M."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="starRating">Star Rating</Label>
                  <Select
                    value={String(starRating)}
                    onValueChange={(v) => setStarRating(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 4, 3, 2, 1].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {'★'.repeat(n)}
                          {'☆'.repeat(5 - n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {engine === 'remotion' && videoType === 'tip_video' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tipTitle">Title</Label>
                <Input
                  id="tipTitle"
                  value={tipTitle}
                  onChange={(e) => setTipTitle(e.target.value)}
                  placeholder="5 Tips for Choosing Paint Colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tips (1-7)</Label>
                {tips.map((tip, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-muted-foreground flex h-9 w-8 shrink-0 items-center justify-center text-sm font-medium">
                      {tip.number}.
                    </span>
                    <Input
                      value={tip.text}
                      onChange={(e) => updateTipText(i, e.target.value)}
                      placeholder={`Tip ${tip.number}...`}
                      required
                    />
                    {tips.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTip(i)}
                        className="text-muted-foreground h-9 px-2"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                {tips.length < 7 && (
                  <Button type="button" variant="outline" size="sm" onClick={addTip}>
                    + Add Tip
                  </Button>
                )}
              </div>
            </>
          )}

          {engine === 'remotion' && videoType === 'before_after_reveal' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="beforeImageUrl">Before Image URL</Label>
                <Input
                  id="beforeImageUrl"
                  value={beforeImageUrl}
                  onChange={(e) => setBeforeImageUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="afterImageUrl">After Image URL</Label>
                <Input
                  id="afterImageUrl"
                  value={afterImageUrl}
                  onChange={(e) => setAfterImageUrl(e.target.value)}
                  placeholder="https://..."
                  type="url"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rLocation">Location (optional)</Label>
                <Input
                  id="rLocation"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Summit, NJ"
                />
              </div>
            </>
          )}

          {engine === 'remotion' && videoType === 'branded_outro' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaText">CTA Text (optional)</Label>
                <Input
                  id="ctaText"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Get Your Free Estimate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaUrl">CTA URL (optional)</Label>
                <Input
                  id="ctaUrl"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="cleanestpainting.com"
                />
              </div>
            </div>
          )}

          {engine === 'remotion' && videoType === 'branded_intro' && (
            <p className="text-muted-foreground text-sm">
              Generates a branded intro using your organization&apos;s logo, name, and tagline. No
              additional input needed.
            </p>
          )}

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={generating}>
            {generating ? 'Generating...' : 'Generate Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
