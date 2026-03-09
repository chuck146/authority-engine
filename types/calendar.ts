import { z } from 'zod'

// --- Calendar content type (extends content types to include social_post) ---

export const calendarContentTypeSchema = z.enum([
  'service_page',
  'location_page',
  'blog_post',
  'social_post',
  'video',
])
export type CalendarContentType = z.infer<typeof calendarContentTypeSchema>

// --- Calendar status ---

export type CalendarStatus = 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'

// --- Database row type ---

export type CalendarEntry = {
  id: string
  organization_id: string
  content_type: 'service_page' | 'location_page' | 'blog_post' | 'social_post' | 'video'
  content_id: string
  scheduled_at: string
  published_at: string | null
  status: CalendarStatus
  error_message: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// --- Calendar view item (for UI — includes content title) ---

export type CalendarViewItem = {
  id: string
  contentType: 'service_page' | 'location_page' | 'blog_post' | 'social_post' | 'video'
  contentId: string
  contentTitle: string
  scheduledAt: string
  publishedAt: string | null
  status: CalendarStatus
  errorMessage: string | null
}

// --- API request schemas ---

export const scheduleContentSchema = z.object({
  contentType: calendarContentTypeSchema,
  contentId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
})

export type ScheduleContentRequest = z.infer<typeof scheduleContentSchema>

export const updateScheduleSchema = z
  .object({
    scheduledAt: z.string().datetime().optional(),
    status: z.enum(['cancelled']).optional(),
  })
  .refine((data) => data.scheduledAt !== undefined || data.status !== undefined, {
    message: 'Must provide scheduledAt or status',
  })

export type UpdateScheduleRequest = z.infer<typeof updateScheduleSchema>

// --- Calendar query params ---

export const calendarQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2024).max(2030),
})

export type CalendarQueryParams = z.infer<typeof calendarQuerySchema>
