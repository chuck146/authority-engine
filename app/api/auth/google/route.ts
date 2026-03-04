import { NextResponse, type NextRequest } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { getGoogleAuthUrl, type GoogleProvider } from '@/lib/google/oauth'
import { createOAuthState } from '@/lib/google/state'

const VALID_PROVIDERS = new Set<GoogleProvider>(['search_console', 'analytics'])

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiRole('admin')
    const providerParam = request.nextUrl.searchParams.get('provider') ?? 'search_console'

    if (!VALID_PROVIDERS.has(providerParam as GoogleProvider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    const provider = providerParam as GoogleProvider
    const state = createOAuthState(auth.organizationId, provider)
    const url = getGoogleAuthUrl(state, provider)
    return NextResponse.redirect(url)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Google OAuth Start Error]', err)
    return NextResponse.json({ error: 'Failed to start Google OAuth' }, { status: 500 })
  }
}
