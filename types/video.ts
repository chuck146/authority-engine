import { z } from 'zod'

// --- Video Engine Discriminator ---

export const videoEngineSchema = z.enum(['veo', 'remotion', 'composite'])
export type VideoEngine = z.infer<typeof videoEngineSchema>

// --- Video Type Discriminator ---

export const videoTypeSchema = z.enum([
  // Veo types
  'cinematic_reel',
  'project_showcase',
  'testimonial_scene',
  'brand_story',
  // Remotion types
  'testimonial_quote',
  'tip_video',
  'before_after_reveal',
  'branded_intro',
  'branded_outro',
  // Composite types (Pipeline B: Veo + Remotion)
  'composite_reel',
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

// --- Veo Per-Type Input Schemas ---

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

// --- Veo Discriminated Union Request ---

export const generateVeoRequestSchema = z.discriminatedUnion('videoType', [
  cinematicReelInputSchema,
  projectShowcaseInputSchema,
  testimonialSceneInputSchema,
  brandStoryInputSchema,
])

// --- Remotion Per-Type Input Schemas ---

const remotionTipItemSchema = z.object({
  number: z.number(),
  text: z.string(),
})

export const testimonialQuoteInputSchema = z.object({
  videoType: z.literal('testimonial_quote'),
  quote: z.string().min(5).max(500),
  customerName: z.string().min(1).max(100),
  starRating: z.number().min(1).max(5).optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
})

export const tipVideoInputSchema = z.object({
  videoType: z.literal('tip_video'),
  title: z.string().min(3).max(200),
  tips: z.array(remotionTipItemSchema).min(1).max(7),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
})

export const beforeAfterRevealInputSchema = z.object({
  videoType: z.literal('before_after_reveal'),
  beforeImageUrl: z.string().url(),
  afterImageUrl: z.string().url(),
  location: z.string().max(200).optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
})

export const brandedIntroInputSchema = z.object({
  videoType: z.literal('branded_intro'),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
})

export const brandedOutroInputSchema = z.object({
  videoType: z.literal('branded_outro'),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(200).optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
})

export const generateRemotionRequestSchema = z.discriminatedUnion('videoType', [
  testimonialQuoteInputSchema,
  tipVideoInputSchema,
  beforeAfterRevealInputSchema,
  brandedIntroInputSchema,
  brandedOutroInputSchema,
])

// --- Composite Pipeline B Input Schema ---

export const compositeReelInputSchema = z.object({
  videoType: z.literal('composite_reel'),
  sceneDescription: z.string().min(10).max(1000),
  audioMood: z.string().min(3).max(200),
  model: veoModelSchema,
  includeIntro: z.boolean().default(true),
  includeOutro: z.boolean().default(true),
  ctaText: z.string().max(100).optional(),
  ctaUrl: z.string().max(200).optional(),
  useStartingFrame: z.boolean().default(true),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
})

export const generateCompositeRequestSchema = compositeReelInputSchema

// --- Combined Request Schema (engine-aware) ---

export const generateVideoRequestSchema = z.union([
  generateVeoRequestSchema,
  generateRemotionRequestSchema,
  generateCompositeRequestSchema,
])

export type CinematicReelInput = z.infer<typeof cinematicReelInputSchema>
export type ProjectShowcaseInput = z.infer<typeof projectShowcaseInputSchema>
export type TestimonialSceneInput = z.infer<typeof testimonialSceneInputSchema>
export type BrandStoryInput = z.infer<typeof brandStoryInputSchema>
export type GenerateVeoRequest = z.infer<typeof generateVeoRequestSchema>

export type TestimonialQuoteInput = z.infer<typeof testimonialQuoteInputSchema>
export type TipVideoInput = z.infer<typeof tipVideoInputSchema>
export type BeforeAfterRevealInput = z.infer<typeof beforeAfterRevealInputSchema>
export type BrandedIntroInput = z.infer<typeof brandedIntroInputSchema>
export type BrandedOutroInput = z.infer<typeof brandedOutroInputSchema>
export type GenerateRemotionRequest = z.infer<typeof generateRemotionRequestSchema>

export type CompositeReelInput = z.infer<typeof compositeReelInputSchema>
export type GenerateCompositeRequest = z.infer<typeof generateCompositeRequestSchema>

export type GenerateVideoRequest = z.infer<typeof generateVideoRequestSchema>

// --- Remotion Video Types (for UI labels) ---

export const REMOTION_VIDEO_TYPES = [
  'testimonial_quote',
  'tip_video',
  'before_after_reveal',
  'branded_intro',
  'branded_outro',
] as const

export const VEO_VIDEO_TYPES = [
  'cinematic_reel',
  'project_showcase',
  'testimonial_scene',
  'brand_story',
] as const

export function isRemotionVideoType(type: string): boolean {
  return (REMOTION_VIDEO_TYPES as readonly string[]).includes(type)
}

export function isVeoVideoType(type: string): boolean {
  return (VEO_VIDEO_TYPES as readonly string[]).includes(type)
}

export const COMPOSITE_VIDEO_TYPES = ['composite_reel'] as const

export function isCompositeVideoType(type: string): boolean {
  return (COMPOSITE_VIDEO_TYPES as readonly string[]).includes(type)
}

// --- Composite Job Sub-Step Progress ---

export type CompositeJobStep = 'intro' | 'veo' | 'outro' | 'stitch' | 'upload'

export type CompositeJobProgress = {
  currentStep: CompositeJobStep
  stepLabel: string
  overallProgress: number
}

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
  engine: VideoEngine | null
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
  compositeStep?: CompositeJobProgress | null
}
