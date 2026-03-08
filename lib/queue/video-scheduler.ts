import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'
import type { VideoJobData } from './video-worker'
import type { GenerateVideoRequest, GenerateVideoResponse } from '@/types/video'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getVideoQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('video-generation', {
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

export async function enqueueVideoJob(
  orgId: string,
  userId: string,
  input: GenerateVideoRequest,
  orgContext: OrgContext,
): Promise<string> {
  const queue = getVideoQueue()
  const job = await withTimeout(
    queue.add('generate-video', { orgId, userId, input, orgContext } satisfies VideoJobData, {
      jobId: `video-${orgId}-${Date.now()}`,
      removeOnComplete: false, // Keep result for status polling
      removeOnFail: false,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10_000,
      },
    }),
  )
  return job.id ?? `video-${orgId}-${Date.now()}`
}

export async function getVideoJobStatus(jobId: string): Promise<{
  state: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number | null
  result?: GenerateVideoResponse
  error?: string
} | null> {
  const queue = getVideoQueue()
  const job = await withTimeout(queue.getJob(jobId))

  if (!job) return null

  const state = await job.getState()

  const stateMap: Record<string, 'queued' | 'processing' | 'completed' | 'failed'> = {
    waiting: 'queued',
    delayed: 'queued',
    active: 'processing',
    completed: 'completed',
    failed: 'failed',
  }

  const progress = typeof job.progress === 'number' ? job.progress : null

  return {
    state: stateMap[state] ?? 'queued',
    progress,
    result: state === 'completed' ? (job.returnvalue as GenerateVideoResponse) : undefined,
    error: state === 'failed' ? job.failedReason : undefined,
  }
}
