import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { listSites } from '@/lib/google/search-console'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const { accessToken } = await getValidToken(auth.organizationId)
    const sites = await listSites({ accessToken })

    return NextResponse.json({
      properties: sites.map((s) => ({
        siteUrl: s.siteUrl,
        permissionLevel: s.permissionLevel,
      })),
    })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GSC Properties Error]', err)
    return NextResponse.json({ error: 'Failed to fetch GSC properties' }, { status: 500 })
  }
}
