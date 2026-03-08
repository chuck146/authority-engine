import { z } from 'zod'

// --- Video Type Discriminator ---

export const videoTypeSchema = z.enum([
  'cinematic_reel',
  'project_showcase',
  'testimonial_scene',
  'brand_story',
])
export type VideoType = z.infer<typeof videoTypeSchema>

// --- Veo Model Selection ---

export const veoModelSchema = z
  .enum(['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'])
  .default('veo-3.1-fast-generate-preview')
export type VeoModel = z.infer<typeof veoModelSchema>

// --- Aspect Ratio ---

export const aspectRatioSchema = z.enum(['9:16', '1:1', '16:9']).default('9:16')
export type AspectRatio = z.infer<typeof aspectRatioSchema>

// --- Per-Type Input Schemas ---

export const cinematicReelInputSchema = z.object({
  videoType: z.literal('cinematic_reel'),
  sceneDescription: z.string().min(10).max(1000),
  audioMood: z.string().min(3).max(200),
  aspectRatio: aspectRatioSchema,
  model: veoModelSchema,
})

export const projectShowcaseInputSchema = z.object({
  videoType: z.literal('project_showcase'),
  beforeDescription: z.string().min(10).max(500),
  afterDescription: z.string().min(10).max(500),
  location: z.string().min(2).max(200),
  model: veoModelSchema,
})

export const testimonialSceneInputSchema = z.object({
  videoType: z.literal('testimonial_scene'),
  quote: z.string().min(10).max(500),
  customerName: z.string().min(2).max(100),
  sentiment: z.enum(['positive', 'grateful', 'impressed']).default('positive'),
  model: veoModelSchema,
})

export const brandStoryInputSchema = z.object({
  videoType: z.literal('brand_story'),
  narrative: z.string().min(10).max(1000),
  style: z.enum(['cinematic', 'documentary', 'energetic']).default('cinematic'),
  model: veoModelSchema,
})

// --- Discriminated Union Request ---

export const generateVideoRequestSchema = z.discriminatedUnion('videoType', [
  cinematicReelInputSchema,
  projectShowcaseInputSchema,
  testimonialSceneInputSchema,
  brandStoryInputSchema,
])

export type CinematicReelInput = z.infer<typeof cinematicReelInputSchema>
export type ProjectShowcaseInput = z.infer<typeof projectShowcaseInputSchema>
export type TestimonialSceneInput = z.infer<typeof testimonialSceneInputSchema>
export type BrandStoryInput = z.infer<typeof brandStoryInputSchema>
export type GenerateVideoRequest = z.infer<typeof generateVideoRequestSchema>

// --- API Response ---

export type GenerateVideoResponse = {
  id: string
  videoType: VideoType
  filename: string
  storagePath: string
  publicUrl: string
  mimeType: string
  sizeBytes: number
  durationSeconds: number | null
}

// --- Video Library Item (for listing grid) ---

export type VideoLibraryItem = {
  id: string
  videoType: VideoType | null
  filename: string
  publicUrl: string
  mimeType: string
  sizeBytes: number | null
  durationSeconds: number | null
  createdAt: string
}

// --- Job Status (for polling in-progress renders) ---

export type VideoJobStatus = {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number | null
  result: GenerateVideoResponse | null
  error: string | null
}
