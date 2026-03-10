import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { syncGscForOrg } from '@/lib/queue/gsc-sync-worker'

export async function POST() {
  try {
    const auth = await requireApiRole('admin')
    await syncGscForOrg(auth.organizationId)
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString() })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GSC Sync Error]', err instanceof Error ? { name: err.name, message: err.message } : 'Unknown error')
    return NextResponse.json({ error: 'Failed to sync Google Search Console' }, { status: 500 })
  }
}
