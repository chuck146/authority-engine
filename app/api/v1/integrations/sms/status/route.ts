import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'

// GET /api/v1/integrations/sms/status
export async function GET() {
  try {
    await requireApiAuth()

    const isConfigured = !!(
      process.env.SALESMESSAGE_API_KEY &&
      process.env.SALESMESSAGE_NUMBER_ID &&
      process.env.SALESMESSAGE_TEAM_ID
    )

    return NextResponse.json({
      isConfigured,
      provider: 'salesmessage',
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    return NextResponse.json({ error: 'Failed to check SMS status' }, { status: 500 })
  }
}
