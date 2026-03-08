import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getVideoJobStatus } from '@/lib/queue/video-scheduler'
import { getRemotionJobStatus } from '@/lib/queue/remotion-scheduler'
import { getCompositeJobStatus } from '@/lib/queue/composite-scheduler'
import type { VideoJobStatus } from '@/types/video'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireApiAuth()
    const { id: jobId } = await context.params

    // Composite jobs have their own queue with sub-step progress
    if (jobId.startsWith('composite-')) {
      const compositeStatus = await getCompositeJobStatus(jobId)
      if (!compositeStatus) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      }

      const response: VideoJobStatus = {
        jobId,
        status: compositeStatus.state,
        progress: compositeStatus.progress,
        result: compositeStatus.result ?? null,
        error: compositeStatus.error ?? null,
        compositeStep: compositeStatus.compositeStep,
      }

      return NextResponse.json(response)
    }

    // Try both Remotion and Veo queues — job ID prefix determines which to try first
    const isRemotionJob = jobId.startsWith('remotion-')
    const primaryFn = isRemotionJob ? getRemotionJobStatus : getVideoJobStatus
    const fallbackFn = isRemotionJob ? getVideoJobStatus : getRemotionJobStatus

    let status = await primaryFn(jobId)
    if (!status) {
      status = await fallbackFn(jobId)
    }

    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const response: VideoJobStatus = {
      jobId,
      status: status.state,
      progress: status.progress,
      result: status.result ?? null,
      error: status.error ?? null,
    }

    return NextResponse.json(response)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Video Status Error]', err)
    return NextResponse.json({ error: 'Failed to check video status' }, { status: 500 })
  }
}
