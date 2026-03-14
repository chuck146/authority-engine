import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendLeadNotification } from '@/lib/email/resend'
import type { OrgSettings } from '@/types'

const leadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required').max(20),
  service: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  organization_id: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parseResult = leadSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    const supabase = await createClient()

    const { error } = await supabase.from('leads' as never).insert({
      organization_id: input.organization_id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      service: input.service ?? null,
      message: input.message ?? null,
    } as never)

    if (error) {
      console.error('Failed to insert lead:', error)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    // Send email notification (fire-and-forget — don't block the response)
    const { data: org } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', input.organization_id)
      .single()

    const settings = org?.settings as unknown as OrgSettings | null
    const notifyEmail = settings?.contact_info?.email
    if (notifyEmail) {
      sendLeadNotification(notifyEmail, input).catch(() => {})
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
