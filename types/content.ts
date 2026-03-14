import { z } from 'zod'
import type { ContentStatus } from './index'

// --- Structured Content Format (stored in content JSONB column) ---

export const contentSectionSchema = z.object({
  title: z.string(),
  body: z.string(),
})

export const structuredContentSchema = z.object({
  headline: z.string(),
  intro: z.string(),
  sections: z.array(contentSectionSchema).min(1),
  cta: z.string(),
  meta_title: z.string().max(60),
  meta_description: z.string().max(160),
})

export type ContentSection = z.infer<typeof contentSectionSchema>
export type StructuredContent = z.infer<typeof structuredContentSchema>

// --- Content Type Discriminator ---

export const contentTypeSchema = z.enum(['service_page', 'location_page', 'blog_post'])
export type ContentType = z.infer<typeof contentTypeSchema>

// --- Generation Request Schemas (per content type) ---

export const servicePageInputSchema = z.object({
  contentType: z.literal('service_page'),
  serviceName: z.string().min(2).max(100),
  serviceDescription: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().min(10).max(500).optional(),
  ),
  targetKeywords: z.array(z.string().max(50)).max(5).optional(),
  tone: z.enum(['professional', 'friendly', 'authoritative']).default('professional'),
})

export const locationPageInputSchema = z.object({
  contentType: z.literal('location_page'),
  city: z.string().min(2).max(100),
  state: z.string().length(2),
  county: z.string().max(50).optional(),
  serviceName: z.string().min(2).max(100),
  targetKeywords: z.array(z.string().max(50)).max(5).optional(),
  tone: z.enum(['professional', 'friendly', 'authoritative']).default('professional'),
})

export const blogPostInputSchema = z.object({
  contentType: z.literal('blog_post'),
  topic: z.string().min(5).max(200),
  targetKeywords: z.array(z.string().max(50)).max(5).optional(),
  category: z.string().max(50).optional(),
  tone: z.enum(['professional', 'friendly', 'authoritative']).default('friendly'),
  targetWordCount: z.number().int().min(300).max(3000).default(800),
})

export const generateContentRequestSchema = z.discriminatedUnion('contentType', [
  servicePageInputSchema,
  locationPageInputSchema,
  blogPostInputSchema,
])

export type ServicePageInput = z.infer<typeof servicePageInputSchema>
export type LocationPageInput = z.infer<typeof locationPageInputSchema>
export type BlogPostInput = z.infer<typeof blogPostInputSchema>
export type GenerateContentRequest = z.infer<typeof generateContentRequestSchema>

// --- API Response ---

export type GenerateContentResponse = {
  id: string
  contentType: ContentType
  title: string
  slug: string
  content: StructuredContent
  status: 'review'
  seoScore: number
}

// --- Status Update Request (approval workflow) ---

export const contentStatusUpdateSchema = z
  .object({
    action: z.enum(['approve', 'reject', 'publish', 'archive']),
    rejectionNote: z.string().min(1).max(1000).optional(),
  })
  .refine((data) => data.action !== 'reject' || !!data.rejectionNote?.trim(), {
    message: 'Rejection note is required when rejecting',
    path: ['rejectionNote'],
  })

export type ContentStatusUpdate = z.infer<typeof contentStatusUpdateSchema>

// --- Content Edit Request (PUT body) ---

export const contentEditRequestSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z
      .string()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens')
      .optional(),
    content: structuredContentSchema.optional(),
    metaTitle: z.string().max(60).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.array(z.string().max(50)).max(10).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  })

export type ContentEditRequest = z.infer<typeof contentEditRequestSchema>

// --- Full content detail (for detail sheet) ---

export type ContentDetail = {
  id: string
  type: ContentType
  title: string
  slug: string
  status: ContentStatus
  content: StructuredContent
  seoScore: number | null
  keywords: string[]
  metaTitle: string | null
  metaDescription: string | null
  approvedBy: string | null
  approvedAt: string | null
  rejectionNote: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

// --- Unified content list item (for the listing table) ---

export type ContentListItem = {
  id: string
  type: ContentType
  title: string
  slug: string
  status: ContentStatus
  seoScore: number | null
  createdAt: string
  updatedAt: string
}
