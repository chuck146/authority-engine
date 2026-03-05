import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'
import type { SmsJobData } from './sms-worker'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getSmsQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('sms-send', {
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
 * Enqueue an SMS send job for a review request.
 */
export async function enqueueSmsJob(
  reviewRequestId: string,
  organizationId: string,
): Promise<string> {
  const queue = getSmsQueue()
  const job = await withTimeout(
    queue.add('send-sms', { reviewRequestId, organizationId } satisfies SmsJobData, {
      jobId: `sms-${reviewRequestId}-${Date.now()}`,
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5_000,
      },
    }),
  )
  return job.id ?? reviewRequestId
}
