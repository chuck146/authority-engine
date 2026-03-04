import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/google/token-manager'
import { revokeToken } from '@/lib/google/oauth'

export async function POST() {
  try {
    const auth = await requireApiRole('admin')
    const supabase = await createClient()

    const { data: conn } = await supabase
      .from('google_connections')
      .select('id, access_token')
      .eq('organization_id', auth.organizationId)
      .eq('provider', 'analytics')
      .maybeSingle()

    if (!conn) {
      return NextResponse.json({ error: 'No GA4 connection found' }, { status: 404 })
    }

    // Best-effort token revocation
    try {
      const accessToken = decrypt(conn.access_token)
      await revokeToken(accessToken)
    } catch {
      // Revocation failure is non-critical
    }

    // Delete the connection
    const { error: deleteError } = await supabase
      .from('google_connections')
      .delete()
      .eq('id', conn.id)

    if (deleteError) {
      console.error('[GA4 Disconnect Error]', deleteError)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GA4 Disconnect Error]', err)
    return NextResponse.json({ error: 'Failed to disconnect GA4' }, { status: 500 })
  }
}
