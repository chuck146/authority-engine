import { Worker, type Job } from 'bullmq'
import { getRedisConnection } from './connection'
import { uploadVideo } from '@/lib/storage/supabase-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import type { GenerateVideoResponse } from '@/types/video'
import type { CompositionId } from '@/services/video/src/types'
import type { Json } from '@/types'

export type RemotionJobData = {
  orgId: string
  userId: string
  compositionId: CompositionId
  inputProps: Record<string, unknown>
  remotionVideoType: string
}

export type RemotionJobResult = GenerateVideoResponse

// Cache the bundle path for the lifetime of the worker process
let cachedBundlePath: string | null = null

async function getBundlePath(): Promise<string> {
  if (cachedBundlePath) return cachedBundlePath

  const { bundle } = await import('@remotion/bundler')
  const path = await import('path')

  const entryPoint = path.resolve(process.cwd(), 'services/video/src/index.ts')
  cachedBundlePath = await bundle({
    entryPoint,
    onProgress: (progress: number) => {
      if (progress % 25 === 0) {
        console.warn(`[remotion] Bundling: ${progress}%`)
      }
    },
  })

  console.warn('[remotion] Bundle cached at:', cachedBundlePath)
  return cachedBundlePath
}

export async function processRemotionJob(job: Job<RemotionJobData>): Promise<RemotionJobResult> {
  const { orgId, userId, compositionId, inputProps, remotionVideoType } = job.data

  // Step 1: Bundle (or use cache)
  await job.updateProgress(5)
  const bundlePath = await getBundlePath()
  await job.updateProgress(15)

  // Step 2: Select composition
  const { selectComposition } = await import('@remotion/renderer')
  const composition = await selectComposition({
    serveUrl: bundlePath,
    id: compositionId,
    inputProps,
  })
  await job.updateProgress(25)

  // Step 3: Render to temp file
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')

  const tmpDir = os.tmpdir()
  const outputPath = path.join(tmpDir, `remotion-${job.id ?? Date.now()}.mp4`)

  const { renderMedia } = await import('@remotion/renderer')
  await renderMedia({
    composition,
    serveUrl: bundlePath,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps,
    onProgress: ({ progress }) => {
      // Map rendering progress 25% → 85%
      const mapped = Math.round(25 + progress * 60)
      void job.updateProgress(mapped)
    },
  })
  await job.updateProgress(85)

  // Step 4: Read rendered file and upload to Supabase Storage
  const videoBuffer = fs.readFileSync(outputPath)
  const upload = await uploadVideo(orgId, remotionVideoType, Buffer.from(videoBuffer), 'video/mp4')
  await job.updateProgress(92)

  // Step 5: Build filename
  const filename = `remotion-${remotionVideoType}-${Date.now()}.mp4`

  // Step 6: Insert media_assets record
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('media_assets')
    .insert({
      organization_id: orgId,
      type: 'video' as const,
      filename,
      storage_path: upload.storagePath,
      storage_provider: 'supabase',
      mime_type: 'video/mp4',
      size_bytes: upload.sizeBytes,
      duration_seconds: composition.durationInFrames / composition.fps,
      metadata: {
        videoType: remotionVideoType,
        engine: 'remotion',
        compositionId,
      } as unknown as Json,
      created_by: userId,
    } as never)
    .select('id')
    .single()

  if (error) throw error

  // Step 7: Cleanup temp file
  try {
    fs.unlinkSync(outputPath)
  } catch {
    // Non-critical — temp file cleanup
  }

  await job.updateProgress(100)

  return {
    id: data!.id as string,
    videoType: remotionVideoType as GenerateVideoResponse['videoType'],
    filename,
    storagePath: upload.storagePath,
    publicUrl: upload.publicUrl,
    mimeType: 'video/mp4',
    sizeBytes: upload.sizeBytes,
    durationSeconds: composition.durationInFrames / composition.fps,
  }
}

export function createRemotionWorker(): Worker<RemotionJobData, RemotionJobResult> {
  return new Worker<RemotionJobData, RemotionJobResult>('remotion-rendering', processRemotionJob, {
    connection: getRedisConnection(),
    concurrency: 1, // CPU-intensive rendering
  })
}
