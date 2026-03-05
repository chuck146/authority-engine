import { Worker, type Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import { createSmsAdapter } from '@/lib/sms'
import { buildReviewRequestMessage } from '@/lib/sms/message-template'
import type { Database } from '@/types/database'

export type SmsJobData = {
  reviewRequestId: string
  organizationId: string
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function processSmsJob(job: Job<SmsJobData>): Promise<void> {
  const { reviewRequestId, organizationId } = job.data
  const supabase = getAdminClient()
  const now = new Date().toISOString()

  // Fetch the review request
  const { data: request, error: reqError } = await supabase
    .from('review_requests')
    .select('*')
    .eq('id', reviewRequestId)
    .eq('organization_id', organizationId)
    .single()

  if (reqError || !request) {
    console.error(`[sms-worker] Review request ${reviewRequestId} not found`)
    return
  }

  // Only process pending or failed requests
  if (request.status !== 'pending' && request.status !== 'failed') {
    console.warn(`[sms-worker] Request ${reviewRequestId} has status ${request.status}, skipping`)
    return
  }

  if (!request.customer_phone) {
    await supabase
      .from('review_requests')
      .update({
        status: 'failed',
        error_message: 'No phone number provided',
        updated_at: now,
      } as never)
      .eq('id', reviewRequestId)
    return
  }

  // Fetch org name for message template
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single()

  const orgName = org?.name ?? 'Our Company'

  // Build message
  const message = buildReviewRequestMessage({
    customerName: request.customer_name,
    orgName,
    reviewUrl: request.review_url,
    customMessage: (request.metadata as Record<string, unknown>)?.customMessage as string | undefined,
  })

  // Send SMS
  const adapter = createSmsAdapter()
  const result = await adapter.send({
    to: request.customer_phone,
    message,
  })

  if (result.success) {
    await supabase
      .from('review_requests')
      .update({
        status: 'sent',
        sent_at: now,
        error_message: null,
        metadata: {
          ...(request.metadata as Record<string, unknown>),
          salesmessage_id: result.messageId,
        },
        updated_at: now,
      } as never)
      .eq('id', reviewRequestId)

    console.warn(`[sms-worker] SMS sent for request ${reviewRequestId}`)
  } else {
    await supabase
      .from('review_requests')
      .update({
        status: 'failed',
        error_message: result.error ?? 'Unknown SMS error',
        updated_at: now,
      } as never)
      .eq('id', reviewRequestId)

    console.error(`[sms-worker] SMS failed for request ${reviewRequestId}: ${result.error}`)
    throw new Error(result.error) // Re-throw so BullMQ can retry
  }
}

export function createSmsWorker(): Worker<SmsJobData> {
  return new Worker<SmsJobData>('sms-send', processSmsJob, {
    connection: getRedisConnection(),
    concurrency: 3,
    limiter: {
      max: 50,
      duration: 60_000,
    },
  })
}
