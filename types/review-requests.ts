import { z } from 'zod'

// --- Channel & Status Literals ---

export const reviewRequestChannelSchema = z.enum(['sms', 'email'])
export type ReviewRequestChannel = z.infer<typeof reviewRequestChannelSchema>

export const reviewRequestStatusSchema = z.enum([
  'pending',
  'sent',
  'delivered',
  'opened',
  'completed',
  'failed',
])
export type ReviewRequestStatus = z.infer<typeof reviewRequestStatusSchema>

export const reviewRequestPlatformSchema = z.enum(['google', 'yelp', 'angi'])
export type ReviewRequestPlatform = z.infer<typeof reviewRequestPlatformSchema>

// --- Create Review Request ---

export const createReviewRequestSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
    .optional(),
  customerEmail: z.string().email().optional(),
  channel: reviewRequestChannelSchema.default('sms'),
  reviewPlatform: reviewRequestPlatformSchema,
  reviewUrl: z.string().url(),
  message: z.string().max(320).optional(),
})

export type CreateReviewRequestInput = z.infer<typeof createReviewRequestSchema>

// --- API Response Types ---

export type ReviewRequestListItem = {
  id: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  channel: ReviewRequestChannel
  reviewUrl: string
  status: ReviewRequestStatus
  sentAt: string | null
  createdAt: string
}

export type ReviewRequestDetail = {
  id: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  channel: ReviewRequestChannel
  reviewUrl: string
  status: ReviewRequestStatus
  sentAt: string | null
  deliveredAt: string | null
  completedAt: string | null
  reviewId: string | null
  errorMessage: string | null
  metadata: Record<string, unknown>
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type ReviewRequestOverview = {
  total: number
  pending: number
  sent: number
  delivered: number
  completed: number
  failed: number
}
