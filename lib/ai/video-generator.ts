import { generateVideo, generateStartingFrame } from './veo'
import { uploadVideo } from '@/lib/storage/supabase-storage'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildCinematicReelPrompt,
  buildProjectShowcasePrompt,
  buildTestimonialScenePrompt,
  buildBrandStoryPrompt,
  formatVeoPrompt,
} from '@/packages/ai/prompts/videos'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { GenerateVideoRequest, GenerateVideoResponse } from '@/types/video'
import type { Json } from '@/types'

export async function generateAndStoreVideo(
  input: GenerateVideoRequest,
  orgContext: OrgContext,
  orgId: string,
  userId: string,
): Promise<GenerateVideoResponse> {
  // 1. Build prompt based on video type
  const { visual, audio } = buildVideoPrompt(input, orgContext)
  const prompt = formatVeoPrompt(visual, audio)

  // 2. Optionally generate starting frame for cinematic_reel and project_showcase
  const useStartingFrame =
    input.videoType === 'cinematic_reel' || input.videoType === 'project_showcase'
  const startingFrame = useStartingFrame
    ? await generateStartingFrame(buildStartingFramePrompt(input, orgContext))
    : undefined

  // 3. Call Veo to generate video
  const result = await generateVideo({
    prompt,
    model: input.model ?? 'veo-3.1-fast-generate-preview',
    image: startingFrame,
    aspectRatio: 'aspectRatio' in input ? (input.aspectRatio ?? '9:16') : '9:16',
  })

  // 4. Upload to Supabase Storage
  const upload = await uploadVideo(orgId, input.videoType, result.videoData, result.mimeType)

  // 5. Build filename
  const filename = buildFilename(input)

  // 6. Insert media_assets record
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('media_assets')
    .insert({
      organization_id: orgId,
      type: 'video' as const,
      filename,
      storage_path: upload.storagePath,
      storage_provider: 'supabase',
      mime_type: result.mimeType,
      size_bytes: upload.sizeBytes,
      duration_seconds: result.durationSeconds,
      metadata: {
        videoType: input.videoType,
        model: input.model ?? 'veo-3.1-fast-generate-preview',
        promptUsed: prompt,
      } as unknown as Json,
      created_by: userId,
    } as never)
    .select('id')
    .single()

  if (error) throw error

  return {
    id: data!.id as string,
    videoType: input.videoType,
    filename,
    storagePath: upload.storagePath,
    publicUrl: upload.publicUrl,
    mimeType: result.mimeType,
    sizeBytes: upload.sizeBytes,
    durationSeconds: result.durationSeconds,
  }
}

function buildVideoPrompt(
  input: GenerateVideoRequest,
  org: OrgContext,
): { visual: string; audio: string } {
  switch (input.videoType) {
    case 'cinematic_reel':
      return buildCinematicReelPrompt(input, org)
    case 'project_showcase':
      return buildProjectShowcasePrompt(input, org)
    case 'testimonial_scene':
      return buildTestimonialScenePrompt(input, org)
    case 'brand_story':
      return buildBrandStoryPrompt(input, org)
  }
}

function buildStartingFramePrompt(input: GenerateVideoRequest, org: OrgContext): string {
  const companyCtx = `for ${org.orgName}`
  switch (input.videoType) {
    case 'cinematic_reel':
      return `A photorealistic establishing shot ${companyCtx}. ${input.sceneDescription}. High quality, 1280x720, suitable as a video starting frame.`
    case 'project_showcase':
      return `A photorealistic before shot of a home improvement project ${companyCtx}. ${input.beforeDescription}. Location: ${input.location}. High quality, 1280x720.`
    default:
      return `A professional home improvement scene ${companyCtx}. High quality, 1280x720.`
  }
}

function buildFilename(input: GenerateVideoRequest): string {
  const slug = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 50)

  switch (input.videoType) {
    case 'cinematic_reel':
      return `reel-${slug(input.sceneDescription)}.mp4`
    case 'project_showcase':
      return `showcase-${slug(input.location)}.mp4`
    case 'testimonial_scene':
      return `testimonial-${slug(input.customerName)}.mp4`
    case 'brand_story':
      return `brand-${slug(input.narrative)}.mp4`
  }
}
