import { Worker, type Job } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import { getValidToken } from '@/lib/google/token-manager'
import { listReviews } from '@/lib/google/business-profile'
import { starRatingToNumber } from '@/types/gbp'
import type { Database } from '@/types/database'

export type GbpSyncJobData = {
  organizationId: string
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function processGbpSyncJob(job: Job<GbpSyncJobData>): Promise<void> {
  const { organizationId } = job.data
  const supabase = getAdminClient()

  let accessToken: string
  let locationName: string
  try {
    const token = await getValidToken(organizationId, 'business_profile')
    accessToken = token.accessToken
    locationName = token.siteUrl // site_url stores the location name for GBP
  } catch {
    // No active GBP connection — skip silently
    return
  }

  if (!locationName) {
    // No location selected yet — skip
    return
  }

  const now = new Date().toISOString()

  try {
    // Paginate through all reviews
    let pageToken: string | undefined
    let totalSynced = 0

    do {
      const result = await listReviews({
        accessToken,
        locationName,
        pageSize: 50,
        pageToken,
      })

      if (result.reviews.length > 0) {
        const BATCH_SIZE = 500
        const rows = result.reviews.map((review) => ({
          organization_id: organizationId,
          platform: 'google' as const,
          external_id: review.reviewId,
          reviewer_name: review.reviewer.displayName,
          reviewer_profile_url: review.reviewer.profilePhotoUrl ?? null,
          rating: starRatingToNumber(review.starRating),
          review_text: review.comment ?? null,
          review_date: review.createTime,
          synced_at: now,
          metadata: {
            gbp_review_name: review.name,
            has_reply: !!review.reviewReply,
            reply_text: review.reviewReply?.comment ?? null,
          },
        }))

        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = rows.slice(i, i + BATCH_SIZE)
          await supabase.from('reviews').upsert(batch as never, {
            onConflict: 'organization_id,platform,external_id',
            ignoreDuplicates: false,
          })
        }

        totalSynced += result.reviews.length
      }

      pageToken = result.nextPageToken
    } while (pageToken)

    // Update last synced timestamp + clear any previous error
    await supabase
      .from('google_connections')
      .update({
        last_synced_at: now,
        sync_error: null,
        updated_at: now,
      } as never)
      .eq('organization_id', organizationId)
      .eq('provider', 'business_profile')

    console.warn(`[gbp-sync] Synced ${totalSynced} reviews for org ${organizationId}`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown sync error'
    console.error(`[gbp-sync] Error syncing org ${organizationId}:`, errorMessage)

    // Record error on connection
    await supabase
      .from('google_connections')
      .update({
        sync_error: errorMessage,
        updated_at: now,
      } as never)
      .eq('organization_id', organizationId)
      .eq('provider', 'business_profile')

    throw err // Re-throw so BullMQ marks the job as failed
  }
}

export function createGbpSyncWorker(): Worker<GbpSyncJobData> {
  return new Worker<GbpSyncJobData>('gbp-sync', processGbpSyncJob, {
    connection: getRedisConnection(),
    concurrency: 2,
  })
}
