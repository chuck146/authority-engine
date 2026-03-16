import { z } from 'zod'

// --- Literals ---

export const leadStatusSchema = z.enum(['new', 'contacted', 'qualified', 'proposed', 'won', 'lost'])
export type LeadStatus = z.infer<typeof leadStatusSchema>

export const leadSourceSchema = z.enum(['website', 'phone', 'referral', 'gbp', 'facebook', 'other'])
export type LeadSource = z.infer<typeof leadSourceSchema>

export const leadScoreLabelSchema = z.enum(['hot', 'warm', 'cold'])
export type LeadScoreLabel = z.infer<typeof leadScoreLabelSchema>

export const leadActivityTypeSchema = z.enum([
  'note',
  'status_change',
  'sms_sent',
  'sms_received',
  'email_sent',
  'email_received',
  'phone_call',
  'assignment_change',
  'score_change',
  'followup_triggered',
  'ai_call',
  'ai_text',
])
export type LeadActivityType = z.infer<typeof leadActivityTypeSchema>

export const followupChannelSchema = z.enum(['sms', 'email'])
export type FollowupChannel = z.infer<typeof followupChannelSchema>

export const followupStatusSchema = z.enum(['pending', 'sent', 'cancelled', 'failed'])
export type FollowupStatus = z.infer<typeof followupStatusSchema>

// --- Input Schemas ---

export const updateLeadSchema = z
  .object({
    status: leadStatusSchema.optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    source: leadSourceSchema.optional(),
    close_reason: z
      .enum(['won', 'lost_price', 'lost_competitor', 'lost_no_response', 'lost_other'])
      .nullable()
      .optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided for update',
  })

export type UpdateLeadRequest = z.infer<typeof updateLeadSchema>

export const createActivitySchema = z.object({
  activityType: leadActivityTypeSchema,
  description: z.string().min(1).max(2000),
  metadata: z.record(z.unknown()).optional(),
})

export type CreateActivityRequest = z.infer<typeof createActivitySchema>

export const sendLeadSmsSchema = z.object({
  message: z.string().min(1).max(1600),
})

export type SendLeadSmsRequest = z.infer<typeof sendLeadSmsSchema>

export const sendLeadEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
})

export type SendLeadEmailRequest = z.infer<typeof sendLeadEmailSchema>

// --- Response Types ---

export type LeadListItem = {
  id: string
  name: string
  email: string
  phone: string
  service: string | null
  status: LeadStatus
  source: LeadSource
  score: number
  scoreLabel: LeadScoreLabel | null
  assignedTo: string | null
  createdAt: string
  updatedAt: string | null
  lastActivityAt: string | null
}

export type LeadActivity = {
  id: string
  activityType: LeadActivityType
  description: string
  metadata: Record<string, unknown>
  createdBy: string | null
  createdAt: string
}

export type LeadFollowup = {
  id: string
  sequenceName: string
  stepNumber: number
  channel: FollowupChannel
  messageTemplate: string
  scheduledAt: string
  status: FollowupStatus
  sentAt: string | null
  errorMessage: string | null
}

export type LeadDetail = {
  id: string
  name: string
  email: string
  phone: string
  service: string | null
  message: string | null
  status: LeadStatus
  source: LeadSource
  score: number
  scoreLabel: LeadScoreLabel | null
  assignedTo: string | null
  notes: string | null
  contactedAt: string | null
  closedAt: string | null
  closeReason: string | null
  createdAt: string
  updatedAt: string | null
  activities: LeadActivity[]
  followups: LeadFollowup[]
}

export type LeadOverview = {
  total: number
  newThisWeek: number
  inPipeline: number
  conversionRate: number
  byStatus: Record<LeadStatus, number>
  bySource: { source: LeadSource; count: number }[]
  topServices: { service: string; count: number }[]
  avgResponseTimeHours: number | null
}
