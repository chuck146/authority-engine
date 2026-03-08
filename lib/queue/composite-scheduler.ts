import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'
import type { CompositeJobData } from './composite-worker'
import type { GenerateVideoResponse, CompositeJobProgress } from '@/types/video'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getCompositeQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('composite-rendering', {
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

export async function enqueueCompositeJob(data: CompositeJobData): Promise<string> {
  const queue = getCompositeQueue()
  const job = await withTimeout(
    queue.add('render-composite', data, {
      jobId: `composite-${data.orgId}-${Date.now()}`,
      removeOnComplete: false,
      removeOnFail: false,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 15_000,
      },
    }),
  )
  return job.id ?? `composite-${data.orgId}-${Date.now()}`
}

export async function getCompositeJobStatus(jobId: string): Promise<{
  state: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number | null
  compositeStep: CompositeJobProgress | null
  result?: GenerateVideoResponse
  error?: string
} | null> {
  const queue = getCompositeQueue()
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

  // Parse composite step progress from job progress
  let compositeStep: CompositeJobProgress | null = null
  let overallProgress: number | null = null

  if (typeof job.progress === 'object' && job.progress !== null) {
    const stepData = job.progress as unknown as CompositeJobProgress
    compositeStep = stepData
    overallProgress = stepData.overallProgress ?? null
  } else if (typeof job.progress === 'number') {
    overallProgress = job.progress
  }

  return {
    state: stateMap[state] ?? 'queued',
    progress: overallProgress,
    compositeStep,
    result: state === 'completed' ? (job.returnvalue as GenerateVideoResponse) : undefined,
    error: state === 'failed' ? job.failedReason : undefined,
  }
}
