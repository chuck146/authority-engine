'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'
import type { VideoLibraryItem, VideoJobStatus } from '@/types/video'

type VideoGenerationStatusProps = {
  jobId: string
  onComplete: (item: VideoLibraryItem) => void
  onError: (error: string) => void
}

const POLL_INTERVAL_MS = 5_000

export function VideoGenerationStatus({ jobId, onComplete, onError }: VideoGenerationStatusProps) {
  const [status, setStatus] = useState<VideoJobStatus | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/v1/video/${jobId}/status`)
        if (!res.ok) return

        const data: VideoJobStatus = await res.json()
        setStatus(data)

        if (data.status === 'completed' && data.result) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onComplete({
            id: data.result.id,
            videoType: data.result.videoType,
            engine: null,
            filename: data.result.filename,
            publicUrl: data.result.publicUrl,
            mimeType: data.result.mimeType,
            sizeBytes: data.result.sizeBytes,
            durationSeconds: data.result.durationSeconds,
            createdAt: new Date().toISOString(),
          })
        } else if (data.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current)
          onError(data.error ?? 'Video generation failed')
        }
      } catch {
        // Ignore poll errors, will retry
      }
    }

    poll()
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [jobId, onComplete, onError])

  const progress = status?.progress ?? 0
  const isComposite = jobId.startsWith('composite-')
  const compositeStep = status?.compositeStep

  const statusLabel =
    isComposite && compositeStep
      ? compositeStep.stepLabel
      : status?.status === 'processing'
        ? 'Generating video...'
        : status?.status === 'queued'
          ? 'Waiting in queue...'
          : 'Starting...'

  const timeEstimate = isComposite
    ? 'Composite pipeline typically takes 5-10 minutes. You can navigate away and come back.'
    : 'Video generation typically takes 2-5 minutes. You can navigate away and come back.'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isComposite ? 'Composite Pipeline In Progress' : 'Video Generation In Progress'}
        </CardTitle>
        <CardDescription>{statusLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} />
        {isComposite && compositeStep && (
          <div className="flex gap-2 text-xs">
            {(['intro', 'veo', 'outro', 'stitch', 'upload'] as const).map((step) => (
              <span
                key={step}
                className={
                  compositeStep.currentStep === step
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }
              >
                {step === 'intro' && 'Intro'}
                {step === 'veo' && 'Cinematic'}
                {step === 'outro' && 'Outro'}
                {step === 'stitch' && 'Stitch'}
                {step === 'upload' && 'Upload'}
                {compositeStep.currentStep === step && ' ...'}
              </span>
            ))}
          </div>
        )}
        <p className="text-muted-foreground text-sm">{timeEstimate}</p>
      </CardContent>
    </Card>
  )
}
