import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncGscForOrg } from '@/lib/queue/gsc-sync-worker'
import type { Database } from '@/types/database'

function verifyCronSecret(authHeader: string | null): boolean {
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!authHeader || !process.env.CRON_SECRET) return false
  if (Buffer.byteLength(authHeader) !== Buffer.byteLength(expected)) return false
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: connections } = await supabase
    .from('google_connections')
    .select('organization_id')
    .eq('provider', 'search_console')
    .eq('status', 'active')

  if (!connections || connections.length === 0) {
    return NextResponse.json({ success: true, synced: 0 })
  }

  let synced = 0
  let failed = 0

  for (const conn of connections) {
    try {
      await syncGscForOrg(conn.organization_id)
      synced++
    } catch (err) {
      failed++
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[Cron GSC Sync] Failed for org:`, message)
    }
  }

  return NextResponse.json({ success: true, synced, failed })
}
