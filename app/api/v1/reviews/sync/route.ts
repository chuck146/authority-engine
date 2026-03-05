import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { enqueueGbpSync } from '@/lib/queue/gbp-scheduler'

export async function POST() {
  try {
    const auth = await requireApiRole('admin')
    const jobId = await enqueueGbpSync(auth.organizationId)
    return NextResponse.json({ success: true, jobId })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Review Sync Error]', err)
    return NextResponse.json({ error: 'Failed to trigger review sync' }, { status: 500 })
  }
}
