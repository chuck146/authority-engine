import { Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import type { Ga4SyncJobData } from './ga4-sync-worker'
import type { Database } from '@/types/database'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getGa4SyncQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('ga4-sync', {
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
 * Enqueue a one-off GA4 sync for a specific org.
 * Used after initial connection setup or manual refresh.
 */
export async function enqueueGa4Sync(organizationId: string): Promise<string> {
  const queue = getGa4SyncQueue()
  const job = await withTimeout(
    queue.add('sync-ga4', { organizationId } satisfies Ga4SyncJobData, {
      jobId: `ga4-sync-${organizationId}-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    }),
  )
  return job.id ?? organizationId
}

/**
 * Schedule daily GA4 sync for all active connections.
 * Call this from the worker startup to set up repeating jobs.
 */
export async function scheduleDailyGa4Sync(): Promise<void> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: connections } = await supabase
    .from('google_connections')
    .select('organization_id')
    .eq('provider', 'analytics')
    .eq('status', 'active')

  if (!connections || connections.length === 0) return

  const queue = getGa4SyncQueue()

  for (const conn of connections) {
    await withTimeout(
      queue.add(
        'sync-ga4-daily',
        { organizationId: conn.organization_id } satisfies Ga4SyncJobData,
        {
          repeat: { pattern: '0 7 * * *' }, // Daily at 7 AM UTC (offset from GSC's 6 AM)
          jobId: `ga4-daily-${conn.organization_id}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      ),
    )
  }
}
