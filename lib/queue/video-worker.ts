import { Worker, type Job } from 'bullmq'
import { getRedisConnection } from './connection'
import { generateAndStoreVideo } from '@/lib/ai/video-generator'
import type { GenerateVideoRequest, GenerateVideoResponse } from '@/types/video'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'

export type VideoJobData = {
  orgId: string
  userId: string
  input: GenerateVideoRequest
  orgContext: OrgContext
}

export type VideoJobResult = GenerateVideoResponse

export async function processVideoJob(job: Job<VideoJobData>): Promise<VideoJobResult> {
  const { orgId, userId, input, orgContext } = job.data

  await job.updateProgress(10)

  const result = await generateAndStoreVideo(input, orgContext, orgId, userId)

  await job.updateProgress(100)

  return result
}

export function createVideoWorker(): Worker<VideoJobData, VideoJobResult> {
  return new Worker<VideoJobData, VideoJobResult>('video-generation', processVideoJob, {
    connection: getRedisConnection(),
    concurrency: 1, // Veo API rate limits
  })
}
