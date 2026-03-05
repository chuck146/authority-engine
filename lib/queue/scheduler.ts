import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getPublishQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('content-publish', {
      connection: getRedisConnection(),
    })
  }
  return queueInstance
}

/** Race a promise against a timeout so callers don't hang when Redis is down. */
function withTimeout<T>(promise: Promise<T>, ms = REDIS_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), ms)),
  ])
}

export type PublishJobData = {
  calendarEntryId: string
  organizationId: string
  contentType: string
  contentId: string
}

export async function schedulePublish(data: PublishJobData, scheduledAt: Date): Promise<string> {
  const queue = getPublishQueue()
  const delay = scheduledAt.getTime() - Date.now()

  const job = await withTimeout(
    queue.add('publish-content', data, {
      delay: Math.max(delay, 0),
      jobId: `calendar-${data.calendarEntryId}`,
      removeOnComplete: true,
      removeOnFail: false,
    }),
  )

  return job.id ?? data.calendarEntryId
}

export async function cancelScheduledPublish(calendarEntryId: string): Promise<void> {
  const queue = getPublishQueue()
  const job = await withTimeout(queue.getJob(`calendar-${calendarEntryId}`))
  if (job) {
    await withTimeout(job.remove())
  }
}
