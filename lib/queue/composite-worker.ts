import { Worker, type Job } from 'bullmq'
import { getRedisConnection } from './connection'
import { processRemotionJob, type RemotionJobData } from './remotion-worker'
import { generateAndStoreVideo } from '@/lib/ai/video-generator'
import { uploadVideo } from '@/lib/storage/supabase-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import { COMPOSITION_IDS } from '@/services/video/src/types'
import type { GenerateVideoResponse, CompositeJobStep } from '@/types/video'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { OrgBranding } from '@/types'
import type { Json } from '@/types'

export type CompositeJobData = {
  orgId: string
  userId: string
  sceneDescription: string
  audioMood: string
  model: string
  includeIntro: boolean
  includeOutro: boolean
  ctaText?: string
  ctaUrl?: string
  useStartingFrame: boolean
  orgContext: OrgContext
  branding: OrgBranding | null
  headingFont?: string
  bodyFont?: string
}

export type CompositeJobResult = GenerateVideoResponse

type ClipInfo = {
  path: string
  durationSeconds: number
}

const STEP_LABELS: Record<CompositeJobStep, string> = {
  intro: 'Rendering branded intro...',
  veo: 'Generating cinematic clip...',
  outro: 'Rendering branded outro...',
  stitch: 'Stitching final video...',
  upload: 'Uploading final video...',
}

function buildStepProgress(step: CompositeJobStep, overallProgress: number) {
  return JSON.stringify({
    currentStep: step,
    stepLabel: STEP_LABELS[step],
    overallProgress,
  })
}

function buildBrandProps(data: CompositeJobData) {
  return {
    orgName: data.orgContext.orgName,
    tagline: data.branding?.tagline ?? undefined,
    primaryColor: data.branding?.primary ?? '#1B2B5B',
    secondaryColor: data.branding?.secondary ?? '#fbbf24',
    accentColor: data.branding?.accent ?? '#1e3a5f',
    headingFont: data.headingFont ?? 'Montserrat',
    bodyFont: data.bodyFont ?? 'DMSans',
  }
}

export async function processCompositeJob(
  job: Job<CompositeJobData>,
): Promise<CompositeJobResult> {
  const data = job.data
  const clips: ClipInfo[] = []
  let totalDuration = 0

  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')
  const tmpDir = os.tmpdir()

  try {
    // --- Step 1: Render Remotion branded intro (3s) ---
    if (data.includeIntro) {
      await job.updateProgress(JSON.parse(buildStepProgress('intro', 5)) as never)

      const introJob = createMockJob<RemotionJobData>({
        orgId: data.orgId,
        userId: data.userId,
        compositionId: COMPOSITION_IDS.BRANDED_INTRO_OUTRO,
        inputProps: {
          brand: buildBrandProps(data),
          mode: 'intro' as const,
        },
        remotionVideoType: 'branded_intro',
      })

      const introResult = await processRemotionJob(introJob)
      const introPath = path.join(tmpDir, `composite-intro-${job.id ?? Date.now()}.mp4`)

      // Download the rendered intro from storage to local temp
      const introBuffer = await downloadFromStorage(introResult.storagePath)
      fs.writeFileSync(introPath, introBuffer)
      clips.push({ path: introPath, durationSeconds: introResult.durationSeconds ?? 3 })
      totalDuration += introResult.durationSeconds ?? 3
    }

    await job.updateProgress(JSON.parse(buildStepProgress('intro', 20)) as never)

    // --- Step 2: Generate Veo cinematic clip (8s) ---
    await job.updateProgress(JSON.parse(buildStepProgress('veo', 25)) as never)

    const veoResult = await generateAndStoreVideo(
      {
        videoType: 'cinematic_reel',
        sceneDescription: data.sceneDescription,
        audioMood: data.audioMood,
        model: data.model as 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview',
        aspectRatio: '9:16',
      },
      data.orgContext,
      data.orgId,
      data.userId,
    )

    const veoPath = path.join(tmpDir, `composite-veo-${job.id ?? Date.now()}.mp4`)
    const veoBuffer = await downloadFromStorage(veoResult.storagePath)
    fs.writeFileSync(veoPath, veoBuffer)
    clips.push({ path: veoPath, durationSeconds: veoResult.durationSeconds ?? 8 })
    totalDuration += veoResult.durationSeconds ?? 8

    await job.updateProgress(JSON.parse(buildStepProgress('veo', 60)) as never)

    // --- Step 3: Render Remotion branded outro (3s) ---
    if (data.includeOutro) {
      await job.updateProgress(JSON.parse(buildStepProgress('outro', 65)) as never)

      const outroJob = createMockJob<RemotionJobData>({
        orgId: data.orgId,
        userId: data.userId,
        compositionId: COMPOSITION_IDS.BRANDED_INTRO_OUTRO,
        inputProps: {
          brand: buildBrandProps(data),
          mode: 'outro' as const,
          ctaText: data.ctaText ?? 'Get Your Free Estimate',
          ctaUrl: data.ctaUrl,
        },
        remotionVideoType: 'branded_outro',
      })

      const outroResult = await processRemotionJob(outroJob)
      const outroPath = path.join(tmpDir, `composite-outro-${job.id ?? Date.now()}.mp4`)

      const outroBuffer = await downloadFromStorage(outroResult.storagePath)
      fs.writeFileSync(outroPath, outroBuffer)
      clips.push({ path: outroPath, durationSeconds: outroResult.durationSeconds ?? 3 })
      totalDuration += outroResult.durationSeconds ?? 3
    }

    await job.updateProgress(JSON.parse(buildStepProgress('outro', 75)) as never)

    // --- Step 4: Stitch all clips together via FFmpeg ---
    await job.updateProgress(JSON.parse(buildStepProgress('stitch', 78)) as never)

    const outputPath = path.join(tmpDir, `composite-final-${job.id ?? Date.now()}.mp4`)
    await stitchClips(clips.map((c) => c.path), outputPath)

    await job.updateProgress(JSON.parse(buildStepProgress('stitch', 88)) as never)

    // --- Step 5: Upload final video to Supabase Storage ---
    await job.updateProgress(JSON.parse(buildStepProgress('upload', 90)) as never)

    const finalBuffer = fs.readFileSync(outputPath)
    const upload = await uploadVideo(
      data.orgId,
      'composite_reel',
      Buffer.from(finalBuffer),
      'video/mp4',
    )

    const filename = `composite-reel-${Date.now()}.mp4`

    // Insert media_assets record
    const admin = createAdminClient()
    const { data: dbRow, error } = await admin
      .from('media_assets')
      .insert({
        organization_id: data.orgId,
        type: 'video' as const,
        filename,
        storage_path: upload.storagePath,
        storage_provider: 'supabase',
        mime_type: 'video/mp4',
        size_bytes: upload.sizeBytes,
        duration_seconds: totalDuration,
        metadata: {
          videoType: 'composite_reel',
          engine: 'composite',
          model: data.model,
          includeIntro: data.includeIntro,
          includeOutro: data.includeOutro,
          clipCount: clips.length,
        } as unknown as Json,
        created_by: data.userId,
      } as never)
      .select('id')
      .single()

    if (error) throw error

    await job.updateProgress(JSON.parse(buildStepProgress('upload', 100)) as never)

    return {
      id: dbRow!.id as string,
      videoType: 'composite_reel',
      filename,
      storagePath: upload.storagePath,
      publicUrl: upload.publicUrl,
      mimeType: 'video/mp4',
      sizeBytes: upload.sizeBytes,
      durationSeconds: totalDuration,
    }
  } finally {
    // Cleanup all temp files
    for (const clip of clips) {
      try {
        fs.unlinkSync(clip.path)
      } catch {
        // Non-critical
      }
    }
    const finalPath = path.join(tmpDir, `composite-final-${job.id ?? Date.now()}.mp4`)
    try {
      fs.unlinkSync(finalPath)
    } catch {
      // Non-critical
    }
  }
}

/** Download a file from Supabase Storage by storage path */
async function downloadFromStorage(storagePath: string): Promise<Buffer> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage.from('media').download(storagePath)

  if (error || !data) {
    throw new Error(`Failed to download from storage: ${error?.message ?? 'no data'}`)
  }

  return Buffer.from(await data.arrayBuffer())
}

/** Stitch multiple MP4 clips together using FFmpeg concat demuxer */
async function stitchClips(inputPaths: string[], outputPath: string): Promise<void> {
  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')
  const { execFile } = await import('child_process')
  const { promisify } = await import('util')
  const execFileAsync = promisify(execFile)

  // Create a concat list file for FFmpeg
  const concatListPath = path.join(os.tmpdir(), `composite-concat-${Date.now()}.txt`)
  const concatContent = inputPaths.map((p) => `file '${p}'`).join('\n')
  fs.writeFileSync(concatListPath, concatContent)

  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      outputPath,
    ])
  } catch (err) {
    // If stream copy fails (different codecs/params), re-encode
    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        outputPath,
      ])
    } catch (reencodeErr) {
      throw new Error(
        `FFmpeg stitching failed: ${reencodeErr instanceof Error ? reencodeErr.message : String(reencodeErr)}`,
      )
    }
  } finally {
    try {
      fs.unlinkSync(concatListPath)
    } catch {
      // Non-critical
    }
  }
}

/** Create a mock Job object for running Remotion sub-renders inline */
function createMockJob<T>(data: T): Job<T> {
  return {
    data,
    id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    updateProgress: async () => {},
  } as unknown as Job<T>
}

export function createCompositeWorker(): Worker<CompositeJobData, CompositeJobResult> {
  return new Worker<CompositeJobData, CompositeJobResult>(
    'composite-rendering',
    processCompositeJob,
    {
      connection: getRedisConnection(),
      concurrency: 1, // Heavy pipeline — one at a time
    },
  )
}
