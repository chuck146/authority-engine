import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const selectLocationSchema = z.object({
  locationName: z.string().min(1, 'Location name is required'),
})

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('admin')
    const body = await request.json()
    const parsed = selectLocationSchema.safeParse(body)

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
      .eq('provider', 'business_profile')
      .eq('status', 'active')
      .maybeSingle()

    if (!conn) {
      return NextResponse.json({ error: 'No active GBP connection found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('google_connections')
      .update({
        site_url: parsed.data.locationName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conn.id)

    if (updateError) {
      console.error('[GBP Select Location Error]', updateError)
      return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }

    return NextResponse.json({ success: true, locationName: parsed.data.locationName })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GBP Select Location Error]', err)
    return NextResponse.json({ error: 'Failed to select GBP location' }, { status: 500 })
  }
}
