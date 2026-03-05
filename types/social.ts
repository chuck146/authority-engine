import { z } from 'zod'

// --- Platform & Post Type Discriminators ---

export const socialPlatformSchema = z.enum(['gbp', 'instagram', 'facebook'])
export type SocialPlatform = z.infer<typeof socialPlatformSchema>

export type GbpPostType = 'update' | 'event' | 'offer'
export type GbpCtaType = 'BOOK' | 'ORDER' | 'LEARN_MORE' | 'SIGN_UP' | 'CALL'

// --- AI Output Format ---

export type SocialPostContent = {
  body: string
  hashtags: string[]
  cta_type?: string
  cta_url?: string
  image_prompt?: string
}

// --- Per-Platform Input Schemas ---

export const gbpPostInputSchema = z.object({
  platform: z.literal('gbp'),
  topic: z.string().min(3).max(300),
  postType: z.enum(['update', 'event', 'offer']).default('update'),
  ctaType: z.enum(['BOOK', 'ORDER', 'LEARN_MORE', 'SIGN_UP', 'CALL']).optional(),
  ctaUrl: z.string().url().optional(),
  tone: z.enum(['professional', 'friendly', 'authoritative']).default('professional'),
  keywords: z.array(z.string().max(50)).max(5).optional(),
  generateImage: z.boolean().default(false),
})

export const instagramPostInputSchema = z.object({
  platform: z.literal('instagram'),
  topic: z.string().min(3).max(300),
  mood: z
    .enum(['inspiring', 'educational', 'promotional', 'behind-the-scenes'])
    .default('inspiring'),
  hashtagCount: z.number().int().min(5).max(30).default(15),
  tone: z.enum(['professional', 'friendly', 'authoritative']).default('friendly'),
  keywords: z.array(z.string().max(50)).max(5).optional(),
  generateImage: z.boolean().default(false),
})

export const facebookPostInputSchema = z.object({
  platform: z.literal('facebook'),
  topic: z.string().min(3).max(300),
  linkUrl: z.string().url().optional(),
  tone: z.enum(['professional', 'friendly', 'authoritative']).default('friendly'),
  keywords: z.array(z.string().max(50)).max(5).optional(),
  generateImage: z.boolean().default(false),
})

// --- Discriminated Union Request ---

export const generateSocialPostRequestSchema = z.discriminatedUnion('platform', [
  gbpPostInputSchema,
  instagramPostInputSchema,
  facebookPostInputSchema,
])

export type GbpPostInput = z.infer<typeof gbpPostInputSchema>
export type InstagramPostInput = z.infer<typeof instagramPostInputSchema>
export type FacebookPostInput = z.infer<typeof facebookPostInputSchema>
export type GenerateSocialPostRequest = z.infer<typeof generateSocialPostRequestSchema>

// --- API Response ---

export type SocialPostResponse = {
  id: string
  platform: SocialPlatform
  postType: string
  title: string | null
  body: string
  hashtags: string[]
  ctaType: string | null
  ctaUrl: string | null
  mediaAssetId: string | null
  status: 'review'
}

// --- List & Detail Types ---

export type SocialPostListItem = {
  id: string
  platform: SocialPlatform
  postType: string
  title: string | null
  body: string
  hashtags: string[]
  status: string
  mediaAssetId: string | null
  createdAt: string
}

export type SocialPostDetail = {
  id: string
  platform: SocialPlatform
  postType: string
  title: string | null
  body: string
  hashtags: string[]
  ctaType: string | null
  ctaUrl: string | null
  mediaAssetId: string | null
  mediaUrl: string | null
  status: string
  keywords: string[]
  metadata: Record<string, unknown>
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// --- Edit Schema ---

export const socialPostEditSchema = z
  .object({
    title: z.string().max(200).optional(),
    body: z.string().min(1).max(2200).optional(),
    hashtags: z.array(z.string().max(100)).max(30).optional(),
    ctaType: z.string().max(50).optional().nullable(),
    ctaUrl: z.string().url().optional().nullable(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  })

export type SocialPostEdit = z.infer<typeof socialPostEditSchema>
