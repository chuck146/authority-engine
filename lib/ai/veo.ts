import { getGeminiClient } from './gemini'
import type { GenerateImageOptions, GeminiImageResult } from './gemini'

export type VeoVideoOptions = {
  prompt: string
  model: string
  image?: GeminiImageResult
  aspectRatio?: string
}

export type VeoVideoResult = {
  videoData: Buffer
  mimeType: string
  durationSeconds: number
  promptUsed: string
}

const POLL_INTERVALS = [5_000, 10_000, 20_000, 40_000, 60_000, 60_000, 60_000, 60_000, 60_000]
const MAX_POLL_TIME = 5 * 60 * 1000 // 5 minutes

export async function generateVideo(options: VeoVideoOptions): Promise<VeoVideoResult> {
  const client = getGeminiClient()

  const params: Record<string, unknown> = {
    model: options.model,
    prompt: options.prompt,
    config: {
      aspectRatio: options.aspectRatio ?? '9:16',
      durationSeconds: 8,
    },
  }

  // Nano Banana -> Veo handoff: pass starting frame as image
  if (options.image) {
    params.image = {
      imageBytes: options.image.imageData.toString('base64'),
      mimeType: options.image.mimeType,
    }
  }

  // Start generation (returns a long-running operation)
  let operation = await client.models.generateVideos(
    params as unknown as Parameters<typeof client.models.generateVideos>[0],
  )

  // Poll until done
  const startTime = Date.now()
  let pollIndex = 0

  while (!operation.done) {
    if (Date.now() - startTime > MAX_POLL_TIME) {
      throw new Error('Video generation timed out after 5 minutes')
    }

    const delay = POLL_INTERVALS[Math.min(pollIndex, POLL_INTERVALS.length - 1)]!
    await new Promise((resolve) => setTimeout(resolve, delay))
    pollIndex++

    operation = await client.operations.getVideosOperation({ operation })
  }

  // Extract video from result
  const generatedVideo = operation.response?.generatedVideos?.[0]
  if (!generatedVideo?.video) {
    throw new Error('Veo returned no video content')
  }

  const video = generatedVideo.video

  // Video can be returned as URI or base64 bytes
  let videoData: Buffer
  if (video.videoBytes) {
    videoData = Buffer.from(video.videoBytes, 'base64')
  } else if (video.uri) {
    const res = await fetch(video.uri)
    if (!res.ok) throw new Error(`Failed to download video from URI: ${res.status}`)
    videoData = Buffer.from(await res.arrayBuffer())
  } else {
    throw new Error('Veo returned video with no data or URI')
  }

  return {
    videoData,
    mimeType: 'video/mp4',
    durationSeconds: 8,
    promptUsed: options.prompt,
  }
}

export async function generateStartingFrame(prompt: string): Promise<GeminiImageResult> {
  const { generateImage } = await import('./gemini')
  return generateImage({ prompt } satisfies GenerateImageOptions)
}
