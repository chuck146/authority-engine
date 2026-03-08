import { Queue } from 'bullmq'
import { getRedisConnection } from './connection'
import type { PremiumJobData } from './premium-worker'
import type { GenerateVideoResponse, PremiumJobProgress } from '@/types/video'

const REDIS_TIMEOUT_MS = 5_000

let queueInstance: Queue | null = null

function getPremiumQueue(): Queue {
  if (!queueInstance) {
    queueInstance = new Queue('premium-rendering', {
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

export async function enqueuePremiumJob(data: PremiumJobData): Promise<string> {
  const queue = getPremiumQueue()
  const job = await withTimeout(
    queue.add('render-premium', data, {
      jobId: `premium-${data.orgId}-${Date.now()}`,
      removeOnComplete: false,
      removeOnFail: false,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 15_000,
      },
    }),
  )
  return job.id ?? `premium-${data.orgId}-${Date.now()}`
}

export async function getPremiumJobStatus(jobId: string): Promise<{
  state: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number | null
  premiumStep: PremiumJobProgress | null
  result?: GenerateVideoResponse
  error?: string
} | null> {
  const queue = getPremiumQueue()
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

  let premiumStep: PremiumJobProgress | null = null
  let overallProgress: number | null = null

  if (typeof job.progress === 'object' && job.progress !== null) {
    const stepData = job.progress as unknown as PremiumJobProgress
    premiumStep = stepData
    overallProgress = stepData.overallProgress ?? null
  } else if (typeof job.progress === 'number') {
    overallProgress = job.progress
  }

  return {
    state: stateMap[state] ?? 'queued',
    progress: overallProgress,
    premiumStep,
    result: state === 'completed' ? (job.returnvalue as GenerateVideoResponse) : undefined,
    error: state === 'failed' ? job.failedReason : undefined,
  }
}
