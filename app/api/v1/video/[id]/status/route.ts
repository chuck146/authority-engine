import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getVideoJobStatus } from '@/lib/queue/video-scheduler'
import type { VideoJobStatus } from '@/types/video'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireApiAuth()
    const { id: jobId } = await context.params

    const status = await getVideoJobStatus(jobId)

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
