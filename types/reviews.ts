import { z } from 'zod'

// --- Platform & Status Literals ---

export const reviewPlatformSchema = z.enum(['google', 'yelp', 'angi', 'manual'])
export type ReviewPlatform = z.infer<typeof reviewPlatformSchema>

export type ReviewResponseStatus = 'pending' | 'draft' | 'review' | 'approved' | 'sent' | 'archived'

export type ReviewSentiment = 'positive' | 'neutral' | 'negative' | 'mixed'

// --- Create Review (Manual Entry) ---

export const createReviewSchema = z.object({
  platform: reviewPlatformSchema,
  reviewerName: z.string().min(1).max(200),
  reviewerProfileUrl: z.string().url().optional(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(5000).optional(),
  reviewDate: z.string().datetime(),
  externalId: z.string().max(500).optional(),
})

export type CreateReviewRequest = z.infer<typeof createReviewSchema>

// --- Generate AI Response ---

export const generateResponseSchema = z.object({
  tone: z.enum(['appreciative', 'empathetic', 'professional', 'friendly']).default('professional'),
  includePromotion: z.boolean().default(false),
  maxLength: z.number().int().min(50).max(2000).default(500),
  customInstructions: z.string().max(500).optional(),
})

export type GenerateResponseRequest = z.infer<typeof generateResponseSchema>

// --- Edit Response ---

export const reviewResponseEditSchema = z
  .object({
    responseText: z.string().min(1).max(2000).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  })

export type ReviewResponseEdit = z.infer<typeof reviewResponseEditSchema>

// --- Status Update ---

export const reviewResponseStatusSchema = z
  .object({
    action: z.enum(['submit_for_review', 'approve', 'reject', 'mark_sent', 'archive']),
    rejectionNote: z.string().min(1).max(1000).optional(),
  })
  .refine((data) => data.action !== 'reject' || !!data.rejectionNote?.trim(), {
    message: 'Rejection note is required when rejecting',
    path: ['rejectionNote'],
  })

export type ReviewResponseStatusUpdate = z.infer<typeof reviewResponseStatusSchema>

// --- AI Output Format ---

export type ReviewResponseContent = {
  response_text: string
  sentiment: ReviewSentiment
  sentiment_score: number
  key_themes: string[]
}

// --- API Response Types ---

export type ReviewListItem = {
  id: string
  platform: ReviewPlatform
  reviewerName: string
  rating: number
  reviewText: string | null
  reviewDate: string
  responseStatus: ReviewResponseStatus
  sentiment: ReviewSentiment | null
  createdAt: string
}

export type ReviewDetail = {
  id: string
  platform: ReviewPlatform
  externalId: string | null
  reviewerName: string
  reviewerProfileUrl: string | null
  rating: number
  reviewText: string | null
  reviewDate: string
  responseText: string | null
  responseStatus: ReviewResponseStatus
  responseGeneratedAt: string | null
  responseApprovedBy: string | null
  responseApprovedAt: string | null
  responseSentAt: string | null
  sentiment: ReviewSentiment | null
  sentimentScore: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type ReviewOverview = {
  totalReviews: number
  averageRating: number
  ratingDistribution: Record<number, number>
  pendingResponses: number
  platformBreakdown: { platform: ReviewPlatform; count: number; avgRating: number }[]
  sentimentBreakdown: { sentiment: ReviewSentiment; count: number }[]
  recentReviews: ReviewListItem[]
}
