import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { ga4PropertySelectSchema } from '@/types/ga4'

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('admin')
    const body = await request.json()
    const parsed = ga4PropertySelectSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data: conn } = await supabase
      .from('google_connections')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('provider', 'analytics')
      .eq('status', 'active')
      .maybeSingle()

    if (!conn) {
      return NextResponse.json({ error: 'No active GA4 connection found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('google_connections')
      .update({
        site_url: parsed.data.propertyId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conn.id)

    if (updateError) {
      console.error('[GA4 Select Property Error]', updateError)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }

    return NextResponse.json({ success: true, propertyId: parsed.data.propertyId })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GA4 Select Property Error]', err)
    return NextResponse.json({ error: 'Failed to select GA4 property' }, { status: 500 })
  }
}
