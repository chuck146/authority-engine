import { Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import type { GbpSyncJobData } from './gbp-sync-worker'
import type { Database } from '@/types/database'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getGbpSyncQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('gbp-sync', {
      connection: getRedisConnection(),
    })
  }
  return queueInstance
}

function withTimeout<T>(promise: Promise<T>, ms = REDIS_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms)),
  ])
}

/**
 * Enqueue a one-off GBP review sync for a specific org.
 * Used after initial connection setup or manual "Sync Now".
 */
export async function enqueueGbpSync(organizationId: string): Promise<string> {
  const queue = getGbpSyncQueue()
  const job = await withTimeout(
    queue.add('sync-gbp', { organizationId } satisfies GbpSyncJobData, {
      jobId: `gbp-sync-${organizationId}-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    }),
  )
  return job.id ?? organizationId
}

/**
 * Schedule daily GBP review sync for all active connections.
 * Call this from the worker startup to set up repeating jobs.
 */
export async function scheduleDailyGbpSync(): Promise<void> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: connections } = await supabase
    .from('google_connections')
    .select('organization_id')
    .eq('provider', 'business_profile')
    .eq('status', 'active')

  if (!connections || connections.length === 0) return

  const queue = getGbpSyncQueue()

  for (const conn of connections) {
    await withTimeout(
      queue.add(
        'sync-gbp-daily',
        { organizationId: conn.organization_id } satisfies GbpSyncJobData,
        {
          repeat: { pattern: '0 8 * * *' }, // Daily at 8 AM UTC
          jobId: `gbp-daily-${conn.organization_id}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      ),
    )
  }
}
