import { Queue } from 'bullmq'
import { createClient } from '@supabase/supabase-js'
import { getRedisConnection } from './connection'
import type { GscSyncJobData } from './gsc-sync-worker'
import type { Database } from '@/types/database'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getGscSyncQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('gsc-sync', {
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
 * Enqueue a one-off GSC sync for a specific org.
 * Used after initial connection setup or manual refresh.
 */
export async function enqueueGscSync(organizationId: string): Promise<string> {
  const queue = getGscSyncQueue()
  const job = await withTimeout(
    queue.add('sync-gsc', { organizationId } satisfies GscSyncJobData, {
      jobId: `gsc-sync-${organizationId}-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
    }),
  )
  return job.id ?? organizationId
}

/**
 * Schedule daily GSC sync for all active connections.
 * Call this from the worker startup to set up repeating jobs.
 */
export async function scheduleDailyGscSync(): Promise<void> {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: connections } = await supabase
    .from('google_connections')
    .select('organization_id')
    .eq('provider', 'search_console')
    .eq('status', 'active')

  if (!connections || connections.length === 0) return

  const queue = getGscSyncQueue()

  for (const conn of connections) {
    await withTimeout(
      queue.add(
        'sync-gsc-daily',
        { organizationId: conn.organization_id } satisfies GscSyncJobData,
        {
          repeat: { pattern: '0 6 * * *' }, // Daily at 6 AM UTC
          jobId: `gsc-daily-${conn.organization_id}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      ),
    )
  }
}
