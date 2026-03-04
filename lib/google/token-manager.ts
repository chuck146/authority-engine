import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { refreshAccessToken, type GoogleProvider } from './oauth'
import type { Database } from '@/types/database'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function getEncryptionKey(): Buffer {
  const hex = process.env.GSC_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('GSC_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  return Buffer.from(hex, 'hex')
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decrypt(encoded: string): string {
  const key = getEncryptionKey()
  const parts = encoded.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format')
  }
  const [ivB64, tagB64, dataB64] = parts
  const iv = Buffer.from(ivB64!, 'base64')
  const tag = Buffer.from(tagB64!, 'base64')
  const data = Buffer.from(dataB64!, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(data) + decipher.final('utf8')
}

function getAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

type TokenResult = {
  accessToken: string
  siteUrl: string
}

const PROVIDER_LABELS: Record<GoogleProvider, string> = {
  search_console: 'Google Search Console',
  analytics: 'Google Analytics',
}

/**
 * Get a valid access token for an org's Google connection.
 * Auto-refreshes if expired, updating DB with new tokens.
 */
export async function getValidToken(
  organizationId: string,
  provider: GoogleProvider = 'search_console',
): Promise<TokenResult> {
  const supabase = getAdminClient()

  const { data: conn, error } = await supabase
    .from('google_connections')
    .select('id, access_token, refresh_token, token_expires_at, site_url')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single()

  if (error || !conn) {
    throw new Error(`No active ${PROVIDER_LABELS[provider]} connection found`)
  }

  const expiresAt = new Date(conn.token_expires_at).getTime()
  const now = Date.now()
  const BUFFER_MS = 5 * 60 * 1000 // refresh 5 min before expiry

  let accessToken = decrypt(conn.access_token)

  if (now >= expiresAt - BUFFER_MS) {
    // Token expired or expiring soon — refresh
    const refreshToken = decrypt(conn.refresh_token)
    const tokens = await refreshAccessToken(refreshToken)

    accessToken = tokens.access_token
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase
      .from('google_connections')
      .update({
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conn.id)
  }

  return { accessToken, siteUrl: conn.site_url }
}
