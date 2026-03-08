import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { listAccountSummaries, listDataStreams } from '@/lib/google/analytics'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const { accessToken } = await getValidToken(auth.organizationId, 'analytics')
    const accounts = await listAccountSummaries({ accessToken })

    const flatProperties = accounts.flatMap((account) =>
      (account.propertySummaries ?? [])
        .filter((prop) => prop.propertyType !== 'PROPERTY_TYPE_ROLLUP')
        .map((prop) => ({
          propertyId: prop.property,
          displayName: prop.displayName,
          accountName: account.displayName,
        })),
    )

    const properties = await Promise.all(
      flatProperties.map(async (prop) => {
        let websiteUrl: string | null = null
        try {
          const streams = await listDataStreams(prop.propertyId, { accessToken })
          const webStream = streams.find(
            (s) => s.type === 'WEB_DATA_STREAM' && s.webStreamData?.defaultUri,
          )
          websiteUrl = webStream?.webStreamData?.defaultUri ?? null
        } catch {
          // Graceful degradation — show property without URL
        }
        return { ...prop, websiteUrl }
      }),
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
