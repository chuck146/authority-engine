import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCodeForTokens } from '@/lib/google/oauth'
import { encrypt } from '@/lib/google/token-manager'
import { validateOAuthState } from '@/lib/google/state'
import { listSites } from '@/lib/google/search-console'
import { listAccountSummaries } from '@/lib/google/analytics'
import { listAccounts, listLocations } from '@/lib/google/business-profile'
import type { Database } from '@/types/database'

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveSiteUrl(provider: string, accessToken: string): Promise<string> {
  if (provider === 'search_console') {
    const sites = await listSites({ accessToken })
    return sites[0]?.siteUrl ?? ''
  }
  if (provider === 'analytics') {
    const accounts = await listAccountSummaries({ accessToken })
    const firstProp = accounts[0]?.propertySummaries?.[0]
    return firstProp?.property ?? ''
  }
  if (provider === 'business_profile') {
    const accounts = await listAccounts({ accessToken })
    if (accounts.length === 0) return ''
    const locations = await listLocations({ accessToken, accountId: accounts[0]!.name })
    return locations[0]?.name ?? ''
  }
  return ''
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // User denied consent or Google returned an error
  if (error) {
    return NextResponse.redirect(
      `${origin}/settings?tab=integrations&status=error&message=${encodeURIComponent(error)}`,
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${origin}/settings?tab=integrations&status=error&message=missing_params`,
    )
  }

  // Validate HMAC-signed state
  const stateData = validateOAuthState(state)
  if (!stateData) {
    return NextResponse.redirect(
      `${origin}/settings?tab=integrations&status=error&message=invalid_state`,
    )
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Resolve site_url / property ID based on provider (non-fatal — user can select later)
    let siteUrl = ''
    try {
      siteUrl = await resolveSiteUrl(stateData.provider, tokens.access_token)
    } catch (resolveErr) {
      console.warn(
        '[Google Callback] resolveSiteUrl failed (non-fatal):',
        resolveErr instanceof Error ? resolveErr.message : resolveErr,
      )
    }

    const supabase = getAdminClient()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Upsert connection (one per org + provider)
    const { error: dbError } = await supabase.from('google_connections').upsert(
      {
        organization_id: stateData.organizationId,
        provider: stateData.provider,
        site_url: siteUrl,
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        token_expires_at: expiresAt,
        scopes: tokens.scope.split(' '),
        connected_by: stateData.userId,
        status: 'active',
        sync_error: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,provider' },
    )

    if (dbError) {
      console.error('[Google Callback] DB error:', dbError)
      return NextResponse.redirect(
        `${origin}/settings?tab=integrations&status=error&message=db_error`,
      )
    }

    return NextResponse.redirect(
      `${origin}/settings?tab=integrations&status=connected&provider=${stateData.provider}`,
    )
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    console.error('[Google Callback] Token exchange failed:', detail)
    return NextResponse.redirect(
      `${origin}/settings?tab=integrations&status=error&message=token_exchange_failed&detail=${encodeURIComponent(detail.slice(0, 200))}`,
    )
  }
}
