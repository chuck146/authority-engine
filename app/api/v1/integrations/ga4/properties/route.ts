import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { listAccountSummaries } from '@/lib/google/analytics'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const { accessToken } = await getValidToken(auth.organizationId, 'analytics')
    const accounts = await listAccountSummaries({ accessToken })

    const properties = accounts.flatMap((account) =>
      (account.propertySummaries ?? []).map((prop) => ({
        propertyId: prop.property,
        displayName: prop.displayName,
        accountName: account.displayName,
      })),
    )

    return NextResponse.json({ properties })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GA4 Properties Error]', err)
    return NextResponse.json({ error: 'Failed to fetch GA4 properties' }, { status: 500 })
  }
}
