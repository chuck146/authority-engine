import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth/guard'
import { VideoPageClient } from '@/components/video/video-page-client'

export const metadata: Metadata = { title: 'Video' }

export default async function VideoPage() {
  await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Video</h1>
        <p className="text-muted-foreground">
          Generate AI-powered cinematic video content using Veo 3.1.
        </p>
      </div>
      <VideoPageClient />
    </div>
  )
}
