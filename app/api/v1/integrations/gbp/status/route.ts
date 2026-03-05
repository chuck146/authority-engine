import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { data: conn } = await supabase
      .from('google_connections')
      .select('id, provider, site_url, status, last_synced_at, sync_error, created_at')
      .eq('organization_id', auth.organizationId)
      .eq('provider', 'business_profile')
      .maybeSingle()

    if (!conn) {
      return NextResponse.json({
        isConnected: false,
        provider: 'business_profile',
        locationName: null,
        status: 'disconnected',
        lastSyncedAt: null,
        syncError: null,
      })
    }

    return NextResponse.json({
      isConnected: conn.status === 'active',
      provider: conn.provider,
      locationName: conn.site_url,
      status: conn.status,
      lastSyncedAt: conn.last_synced_at,
      syncError: conn.sync_error,
      connectedAt: conn.created_at,
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GBP Status Error]', err)
    return NextResponse.json({ error: 'Failed to fetch GBP status' }, { status: 500 })
  }
}
