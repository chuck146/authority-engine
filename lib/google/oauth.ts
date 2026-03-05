const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

export type GoogleProvider = 'search_console' | 'analytics'

const SCOPES_BY_PROVIDER: Record<GoogleProvider, string[]> = {
  search_console: [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/indexing',
  ],
  analytics: ['https://www.googleapis.com/auth/analytics.readonly'],
}

function getClientId(): string {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID
  if (!id) throw new Error('GOOGLE_OAUTH_CLIENT_ID not configured')
  return id
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  if (!secret) throw new Error('GOOGLE_OAUTH_CLIENT_SECRET not configured')
  return secret
}

function getRedirectUri(): string {
  return process.env.GOOGLE_OAUTH_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback'
}

export function getGoogleAuthUrl(
  state: string,
  provider: GoogleProvider = 'search_console',
): string {
  const scopes = SCOPES_BY_PROVIDER[provider]
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export type GoogleTokens = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token exchange failed (${res.status}): ${body}`)
  }

  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google token refresh failed (${res.status}): ${body}`)
  }

  const tokens = await res.json()
  // Refresh responses may omit refresh_token — preserve the original
  return { ...tokens, refresh_token: tokens.refresh_token ?? refreshToken }
}

export async function revokeToken(token: string): Promise<void> {
  const res = await fetch(`${GOOGLE_REVOKE_URL}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })

  // Google returns 200 on success — non-200 is a best-effort failure
  if (!res.ok) {
    console.warn(`[Google OAuth] Token revocation returned ${res.status}`)
  }
}
