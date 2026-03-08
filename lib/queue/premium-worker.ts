import { Worker, type Job } from 'bullmq'
import { getRedisConnection } from './connection'
import { processRemotionJob, type RemotionJobData } from './remotion-worker'
import { downloadFromStorage, stitchClips, createMockJob, buildBrandProps } from './video-utils'
import { generatePremiumScript } from '@/lib/ai/premium-script-generator'
import { generateStartingFrame } from '@/lib/ai/veo'
import { generateAndStoreVideo } from '@/lib/ai/video-generator'
import { uploadVideo } from '@/lib/storage/supabase-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import { COMPOSITION_IDS } from '@/services/video/src/types'
import type {
  GenerateVideoResponse,
  PremiumReelInput,
  PremiumJobStep,
  PremiumScript,
} from '@/types/video'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { OrgBranding } from '@/types'
import type { Json } from '@/types'

export type PremiumJobData = {
  orgId: string
  userId: string
  topic: string
  style: 'cinematic' | 'documentary' | 'energetic' | 'elegant'
  targetAudience?: string
  sceneCount: number
  model: string
  includeIntro: boolean
  includeOutro: boolean
  ctaText?: string
  ctaUrl?: string
  orgContext: OrgContext
  branding: OrgBranding | null
  headingFont?: string
  bodyFont?: string
}

export type PremiumJobResult = GenerateVideoResponse

type ClipInfo = {
  path: string
  durationSeconds: number
}

const STEP_LABELS: Record<PremiumJobStep, string> = {
  script: 'Writing multi-scene script...',
  keyframes: 'Generating key frames...',
  scenes: 'Rendering cinematic scenes...',
  intro: 'Rendering branded intro...',
  outro: 'Rendering branded outro...',
  stitch: 'Stitching final video...',
  upload: 'Uploading final video...',
}

function buildStepProgress(
  step: PremiumJobStep,
  overallProgress: number,
  sceneProgress?: { currentScene: number; totalScenes: number },
) {
  return JSON.stringify({
    currentStep: step,
    stepLabel: STEP_LABELS[step],
    overallProgress,
    ...(sceneProgress ? { sceneProgress } : {}),
  })
}

export async function processPremiumJob(job: Job<PremiumJobData>): Promise<PremiumJobResult> {
  const data = job.data
  const clips: ClipInfo[] = []
  let totalDuration = 0

  const fs = await import('fs')
  const path = await import('path')
  const os = await import('os')
  const tmpDir = os.tmpdir()
  const tempFiles: string[] = []

  try {
    // --- Step 1: Generate script via Claude (0-10%) ---
    await job.updateProgress(JSON.parse(buildStepProgress('script', 2)) as never)

    const input: PremiumReelInput = {
      videoType: 'premium_reel',
      topic: data.topic,
      style: data.style,
      targetAudience: data.targetAudience,
      sceneCount: data.sceneCount,
      model: data.model as PremiumReelInput['model'],
      includeIntro: data.includeIntro,
      includeOutro: data.includeOutro,
      ctaText: data.ctaText,
      ctaUrl: data.ctaUrl,
      headingFont: data.headingFont,
      bodyFont: data.bodyFont,
    }

    const script: PremiumScript = await generatePremiumScript(input, data.orgContext)

    await job.updateProgress(JSON.parse(buildStepProgress('script', 10)) as never)

    // --- Step 2: Generate key frames via Nano Banana 2 (10-25%) ---
    await job.updateProgress(JSON.parse(buildStepProgress('keyframes', 12)) as never)

    const keyFrames: (Buffer | undefined)[] = []
    const progressPerFrame = 13 / script.scenes.length

    for (let i = 0; i < script.scenes.length; i++) {
      try {
        const sceneItem = script.scenes[i]
        if (!sceneItem) throw new Error('Scene not found')
        const frame = await generateStartingFrame(sceneItem.imagePrompt)
        keyFrames.push(frame.imageData)
      } catch {
        // Graceful skip — Veo can still render without a starting frame
        keyFrames.push(undefined)
      }
      await job.updateProgress(
        JSON.parse(
          buildStepProgress('keyframes', Math.round(12 + progressPerFrame * (i + 1))),
        ) as never,
      )
    }

    // --- Step 3: Render each scene via Veo (25-70%) ---
    const sceneProgressRange = 45
    const progressPerScene = sceneProgressRange / script.scenes.length

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i]
      if (!scene) continue
      await job.updateProgress(
        JSON.parse(
          buildStepProgress('scenes', Math.round(25 + progressPerScene * i), {
            currentScene: i + 1,
            totalScenes: script.scenes.length,
          }),
        ) as never,
      )

      const veoResult = await generateAndStoreVideo(
        {
          videoType: 'cinematic_reel',
          sceneDescription: scene.description,
          audioMood: scene.audio,
          model: data.model as 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview',
          aspectRatio: '9:16',
        },
        data.orgContext,
        data.orgId,
        data.userId,
      )

      const scenePath = path.join(tmpDir, `premium-scene-${i}-${job.id ?? Date.now()}.mp4`)
      const sceneBuffer = await downloadFromStorage(veoResult.storagePath)
      fs.writeFileSync(scenePath, sceneBuffer)
      tempFiles.push(scenePath)
      clips.push({ path: scenePath, durationSeconds: veoResult.durationSeconds ?? 8 })
      totalDuration += veoResult.durationSeconds ?? 8
    }

    await job.updateProgress(
      JSON.parse(
        buildStepProgress('scenes', 70, {
          currentScene: script.scenes.length,
          totalScenes: script.scenes.length,
        }),
      ) as never,
    )

    // --- Step 4: Render Remotion branded intro (70-75%) ---
    if (data.includeIntro) {
      await job.updateProgress(JSON.parse(buildStepProgress('intro', 71)) as never)

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
      const introPath = path.join(tmpDir, `premium-intro-${job.id ?? Date.now()}.mp4`)
      const introBuffer = await downloadFromStorage(introResult.storagePath)
      fs.writeFileSync(introPath, introBuffer)
      tempFiles.push(introPath)

      // Prepend intro to clips
      clips.unshift({ path: introPath, durationSeconds: introResult.durationSeconds ?? 3 })
      totalDuration += introResult.durationSeconds ?? 3
    }

    await job.updateProgress(JSON.parse(buildStepProgress('intro', 75)) as never)

    // --- Step 5: Render Remotion branded outro (75-80%) ---
    if (data.includeOutro) {
      await job.updateProgress(JSON.parse(buildStepProgress('outro', 76)) as never)

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
      const outroPath = path.join(tmpDir, `premium-outro-${job.id ?? Date.now()}.mp4`)
      const outroBuffer = await downloadFromStorage(outroResult.storagePath)
      fs.writeFileSync(outroPath, outroBuffer)
      tempFiles.push(outroPath)

      clips.push({ path: outroPath, durationSeconds: outroResult.durationSeconds ?? 3 })
      totalDuration += outroResult.durationSeconds ?? 3
    }

    await job.updateProgress(JSON.parse(buildStepProgress('outro', 80)) as never)

    // --- Step 6: Stitch all clips via FFmpeg (80-90%) ---
    await job.updateProgress(JSON.parse(buildStepProgress('stitch', 82)) as never)

    const outputPath = path.join(tmpDir, `premium-final-${job.id ?? Date.now()}.mp4`)
    tempFiles.push(outputPath)
    await stitchClips(
      clips.map((c) => c.path),
      outputPath,
    )

    await job.updateProgress(JSON.parse(buildStepProgress('stitch', 90)) as never)

    // --- Step 7: Upload to Supabase Storage (90-100%) ---
    await job.updateProgress(JSON.parse(buildStepProgress('upload', 92)) as never)

    const finalBuffer = fs.readFileSync(outputPath)
    const upload = await uploadVideo(
      data.orgId,
      'premium_reel',
      Buffer.from(finalBuffer),
      'video/mp4',
    )

    const filename = `premium-reel-${Date.now()}.mp4`

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
          videoType: 'premium_reel',
          engine: 'premium',
          model: data.model,
          style: data.style,
          sceneCount: script.scenes.length,
          scriptTitle: script.title,
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
      videoType: 'premium_reel',
      filename,
      storagePath: upload.storagePath,
      publicUrl: upload.publicUrl,
      mimeType: 'video/mp4',
      sizeBytes: upload.sizeBytes,
      durationSeconds: totalDuration,
    }
  } finally {
    // Cleanup all temp files
    const fs = await import('fs')
    for (const filePath of tempFiles) {
      try {
        fs.unlinkSync(filePath)
      } catch {
        // Non-critical
      }
    }
  }
}

export function createPremiumWorker(): Worker<PremiumJobData, PremiumJobResult> {
  return new Worker<PremiumJobData, PremiumJobResult>('premium-rendering', processPremiumJob, {
    connection: getRedisConnection(),
    concurrency: 1,
  })
}
