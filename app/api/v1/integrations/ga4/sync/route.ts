import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { syncGa4ForOrg } from '@/lib/queue/ga4-sync-worker'

export async function POST() {
  try {
    const auth = await requireApiRole('admin')
    await syncGa4ForOrg(auth.organizationId)
    return NextResponse.json({ success: true, syncedAt: new Date().toISOString() })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(
      '[GA4 Sync Error]',
      err instanceof Error ? { name: err.name, message } : 'Unknown error',
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
