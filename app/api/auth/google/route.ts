import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { getGoogleAuthUrl } from '@/lib/google/oauth'
import { createOAuthState } from '@/lib/google/state'

export async function GET() {
  try {
    const auth = await requireApiRole('admin')
    const state = createOAuthState(auth.organizationId)
    const url = getGoogleAuthUrl(state)
    return NextResponse.redirect(url)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Google OAuth Start Error]', err)
    return NextResponse.json({ error: 'Failed to start Google OAuth' }, { status: 500 })
  }
}
