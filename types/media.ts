import { z } from 'zod'

// --- Image Type Discriminator ---

export const imageTypeSchema = z.enum(['blog_thumbnail', 'location_hero', 'service_hero', 'social_graphic'])
export type ImageType = z.infer<typeof imageTypeSchema>

// --- Style and Mood Options ---

export const imageStyleSchema = z
  .enum(['photorealistic', 'illustration', 'flat', 'watercolor'])
  .default('photorealistic')
export const imageMoodSchema = z
  .enum(['warm', 'cool', 'vibrant', 'neutral', 'dramatic'])
  .default('warm')

// --- Per-Type Input Schemas ---

export const blogThumbnailInputSchema = z.object({
  imageType: z.literal('blog_thumbnail'),
  topic: z.string().min(5).max(200),
  style: imageStyleSchema,
  mood: imageMoodSchema,
})

export const locationHeroInputSchema = z.object({
  imageType: z.literal('location_hero'),
  city: z.string().min(2).max(100),
  state: z.string().length(2),
  serviceName: z.string().min(2).max(100),
  style: imageStyleSchema,
})

export const serviceHeroInputSchema = z.object({
  imageType: z.literal('service_hero'),
  serviceName: z.string().min(2).max(200),
  serviceDescription: z.string().max(500).optional(),
  style: imageStyleSchema,
})

export const socialGraphicInputSchema = z.object({
  imageType: z.literal('social_graphic'),
  message: z.string().min(5).max(300),
  style: imageStyleSchema,
  mood: imageMoodSchema,
})

// --- Discriminated Union Request ---

export const generateImageRequestSchema = z.discriminatedUnion('imageType', [
  blogThumbnailInputSchema,
  locationHeroInputSchema,
  serviceHeroInputSchema,
  socialGraphicInputSchema,
])

export type BlogThumbnailInput = z.infer<typeof blogThumbnailInputSchema>
export type LocationHeroInput = z.infer<typeof locationHeroInputSchema>
export type ServiceHeroInput = z.infer<typeof serviceHeroInputSchema>
export type SocialGraphicInput = z.infer<typeof socialGraphicInputSchema>
export type GenerateImageRequest = z.infer<typeof generateImageRequestSchema>

// --- API Response ---

export type GenerateImageResponse = {
  id: string
  imageType: ImageType
  filename: string
  storagePath: string
  publicUrl: string
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  altText: string
}

// --- Media Library Item (for listing grid) ---

export type MediaLibraryItem = {
  id: string
  imageType: ImageType | null
  filename: string
  publicUrl: string
  mimeType: string
  sizeBytes: number | null
  width: number | null
  height: number | null
  altText: string | null
  createdAt: string
}
