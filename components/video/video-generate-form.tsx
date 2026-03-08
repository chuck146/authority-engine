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
import type { VideoType, VideoLibraryItem } from '@/types/video'

type VideoGenerateFormProps = {
  onJobComplete: (item: VideoLibraryItem) => void
}

const VIDEO_TYPE_LABELS: Record<VideoType, string> = {
  cinematic_reel: 'Cinematic Reel',
  project_showcase: 'Project Showcase',
  testimonial_scene: 'Testimonial Scene',
  brand_story: 'Brand Story',
}

export function VideoGenerateForm({ onJobComplete }: VideoGenerateFormProps) {
  const [videoType, setVideoType] = useState<VideoType>('cinematic_reel')
  const [model, setModel] = useState('veo-3.1-fast-generate-preview')
  const [generating, setGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dynamic fields per video type
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

  if (jobId) {
    return (
      <VideoGenerationStatus jobId={jobId} onComplete={handleJobDone} onError={handleJobError} />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Video</CardTitle>
        <CardDescription>Create AI-powered cinematic video content using Veo 3.1.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="videoType">Video Type</Label>
              <Select value={videoType} onValueChange={(v) => setVideoType(v as VideoType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VIDEO_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          </div>

          {videoType === 'cinematic_reel' && (
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

          {videoType === 'project_showcase' && (
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

          {videoType === 'testimonial_scene' && (
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

          {videoType === 'brand_story' && (
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

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" disabled={generating}>
            {generating ? 'Generating...' : 'Generate Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
