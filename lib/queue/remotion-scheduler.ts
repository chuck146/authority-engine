import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'
import type { RemotionJobData } from './remotion-worker'
import type { GenerateVideoResponse } from '@/types/video'
import type { CompositionId } from '@/services/video/src/types'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getRemotionQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('remotion-rendering', {
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

export async function enqueueRemotionJob(
  orgId: string,
  userId: string,
  compositionId: CompositionId,
  inputProps: Record<string, unknown>,
  remotionVideoType: string,
): Promise<string> {
  const queue = getRemotionQueue()
  const job = await withTimeout(
    queue.add(
      'render-remotion',
      {
        orgId,
        userId,
        compositionId,
        inputProps,
        remotionVideoType,
      } satisfies RemotionJobData,
      {
        jobId: `remotion-${orgId}-${Date.now()}`,
        removeOnComplete: false,
        removeOnFail: false,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10_000,
        },
      },
    ),
  )
  return job.id ?? `remotion-${orgId}-${Date.now()}`
}

export async function getRemotionJobStatus(jobId: string): Promise<{
  state: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number | null
  result?: GenerateVideoResponse
  error?: string
} | null> {
  const queue = getRemotionQueue()
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
