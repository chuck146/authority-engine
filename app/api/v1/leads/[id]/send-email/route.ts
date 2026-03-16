import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { sendLeadEmailSchema } from '@/types/leads'
import { sendLeadEmail } from '@/lib/email/resend'

type RouteContext = { params: Promise<{ id: string }> }

type LeadEmailRow = { id: string; email: string; name: string }

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireApiRole('editor')
    const { id } = await context.params
    const body = await request.json()

    const parseResult = sendLeadEmailSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { subject, body: emailBody } = parseResult.data
    const supabase = await createClient()

    // Fetch lead + org
    const { data } = await supabase
      .from('leads' as never)
      .select('id, email, name')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<LeadEmailRow[]>()
      .single()

    const lead = data as LeadEmailRow | null

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', auth.organizationId)
      .single()

    const orgName = org?.name ?? 'Our Team'

    try {
      await sendLeadEmail({ to: lead.email, subject, body: emailBody, orgName })
    } catch {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    // Create activity
    await supabase.from('lead_activities' as never).insert({
      organization_id: auth.organizationId,
      lead_id: id,
      activity_type: 'email_sent',
      description: `Email sent to ${lead.name}: "${subject}"`,
      metadata: { subject, bodyPreview: emailBody.slice(0, 200) },
      created_by: auth.userId,
    } as never)

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
