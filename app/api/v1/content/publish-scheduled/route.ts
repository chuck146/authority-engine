import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { publishScheduledContent } from '@/lib/queue/publish-worker'

export const maxDuration = 60

export async function POST() {
  try {
    await requireApiRole('admin')
    const result = await publishScheduledContent()
    return NextResponse.json({
      success: true,
      published: result.published,
      failed: result.failed,
      publishedAt: new Date().toISOString(),
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Publish Scheduled Error]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
