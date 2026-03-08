import { createHmac, randomBytes } from 'node:crypto'
import type { GoogleProvider } from './oauth'

function getSecret(): string {
  const secret = process.env.GSC_ENCRYPTION_KEY
  if (!secret) throw new Error('GSC_ENCRYPTION_KEY not configured')
  return secret
}

/**
 * Create an HMAC-signed state parameter for OAuth.
 * Format: orgId.userId.provider.nonce.signature
 */
export function createOAuthState(
  organizationId: string,
  userId: string,
  provider: GoogleProvider = 'search_console',
): string {
  const nonce = randomBytes(16).toString('hex')
  const payload = `${organizationId}.${userId}.${provider}.${nonce}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}.${signature}`
}

type OAuthStateResult = {
  organizationId: string
  userId: string
  provider: GoogleProvider
}

/**
 * Validate and extract orgId + userId + provider from a signed state parameter.
 * Supports 5-part (orgId.userId.provider.nonce.sig) format.
 * Returns null if signature is invalid.
 */
export function validateOAuthState(state: string): OAuthStateResult | null {
  const parts = state.split('.')

  let organizationId: string
  let userId: string
  let provider: GoogleProvider
  let signature: string
  let payload: string

  if (parts.length === 5) {
    // Current format: orgId.userId.provider.nonce.signature
    organizationId = parts[0]!
    userId = parts[1]!
    provider = parts[2] as GoogleProvider
    const nonce = parts[3]!
    signature = parts[4]!
    if (!organizationId || !userId || !provider || !nonce || !signature) return null
    if (
      provider !== 'search_console' &&
      provider !== 'analytics' &&
      provider !== 'business_profile'
    )
      return null
    payload = `${organizationId}.${userId}.${provider}.${nonce}`
  } else {
    return null
  }

  const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')

  // Constant-time comparison
  if (signature.length !== expected.length) return null
  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  return { organizationId, userId, provider }
}
