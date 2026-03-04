import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'

let queueInstance: Queue | null = null

function getPublishQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('content-publish', {
      connection: getRedisConnection(),
    })
  }
  return queueInstance
}

export type PublishJobData = {
  calendarEntryId: string
  organizationId: string
  contentType: string
  contentId: string
}

export async function schedulePublish(
  data: PublishJobData,
  scheduledAt: Date,
): Promise<string> {
  const queue = getPublishQueue()
  const delay = scheduledAt.getTime() - Date.now()

  const job = await queue.add('publish-content', data, {
    delay: Math.max(delay, 0),
    jobId: `calendar-${data.calendarEntryId}`,
    removeOnComplete: true,
    removeOnFail: false,
  })

  return job.id ?? data.calendarEntryId
}

export async function cancelScheduledPublish(calendarEntryId: string): Promise<void> {
  const queue = getPublishQueue()
  const job = await queue.getJob(`calendar-${calendarEntryId}`)
  if (job) {
    await job.remove()
  }
}
