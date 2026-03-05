import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { listAccounts, listLocations } from '@/lib/google/business-profile'
import type { GbpLocationOption } from '@/types/gbp'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const { accessToken } = await getValidToken(auth.organizationId, 'business_profile')

    const accounts = await listAccounts({ accessToken })
    const locations: GbpLocationOption[] = []

    for (const account of accounts) {
      const locs = await listLocations({ accessToken, accountId: account.name })
      for (const loc of locs) {
        const addressParts = loc.storefrontAddress
          ? [
              ...(loc.storefrontAddress.addressLines ?? []),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.administrativeArea,
            ].filter(Boolean)
          : []

        locations.push({
          value: loc.name,
          label: loc.title,
          address: addressParts.join(', ') || undefined,
        })
      }
    }

    return NextResponse.json({ locations })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GBP Locations Error]', err)
    return NextResponse.json({ error: 'Failed to fetch GBP locations' }, { status: 500 })
  }
}
