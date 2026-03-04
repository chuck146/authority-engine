import { createHmac, randomBytes } from 'node:crypto'

function getSecret(): string {
  const secret = process.env.GSC_ENCRYPTION_KEY
  if (!secret) throw new Error('GSC_ENCRYPTION_KEY not configured')
  return secret
}

/**
 * Create an HMAC-signed state parameter for OAuth.
 * Format: orgId.nonce.signature
 */
export function createOAuthState(organizationId: string): string {
  const nonce = randomBytes(16).toString('hex')
  const payload = `${organizationId}.${nonce}`
  const signature = createHmac('sha256', getSecret()).update(payload).digest('hex')
  return `${payload}.${signature}`
}

/**
 * Validate and extract orgId from a signed state parameter.
 * Returns null if signature is invalid.
 */
export function validateOAuthState(state: string): { organizationId: string } | null {
  const parts = state.split('.')
  if (parts.length !== 3) return null

  const [organizationId, nonce, signature] = parts
  if (!organizationId || !nonce || !signature) return null

  const payload = `${organizationId}.${nonce}`
  const expected = createHmac('sha256', getSecret()).update(payload).digest('hex')

  // Constant-time comparison
  if (signature.length !== expected.length) return null
  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  if (mismatch !== 0) return null

  return { organizationId }
}
