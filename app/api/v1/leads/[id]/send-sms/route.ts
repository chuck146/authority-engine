import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { sendLeadSmsSchema } from '@/types/leads'
import { createSmsAdapter } from '@/lib/sms/salesmessage'

type RouteContext = { params: Promise<{ id: string }> }

type LeadContactRow = { id: string; phone: string; name: string }

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await context.params
    const body = await request.json()

    const parseResult = sendLeadSmsSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { message } = parseResult.data
    const supabase = await createClient()

    // Fetch lead
    const { data } = await supabase
      .from('leads' as never)
      .select('id, phone, name')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<LeadContactRow[]>()
      .single()

    const lead = data as LeadContactRow | null

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Send SMS
    const adapter = createSmsAdapter()
    const status = adapter.getStatus()
    if (!status.isConfigured) {
      return NextResponse.json({ error: 'SMS not configured' }, { status: 503 })
    }

    const result = await adapter.send({ to: lead.phone, message })

    // Create activity
    await supabase.from('lead_activities' as never).insert({
      organization_id: auth.organizationId,
      lead_id: id,
      activity_type: 'sms_sent',
      description: `SMS sent to ${lead.name}`,
      metadata: {
        messagePreview: message.slice(0, 50),
        messageLength: message.length,
        messageId: result.messageId,
        success: result.success,
      },
      created_by: auth.userId,
    } as never)

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? 'Failed to send SMS' }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
