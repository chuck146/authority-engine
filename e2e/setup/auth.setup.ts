import { test as setup } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '../helpers/supabase-admin'
import { TEST_USER_EMAIL } from '../helpers/test-data'

const AUTH_FILE = '.auth/user.json'

// Base64url encode a string (matching @supabase/ssr's cookie encoding)
function stringToBase64URL(str: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(str)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Authenticate by exchanging an OTP for a session, then injecting the session
// cookie into the browser context. This avoids navigating to the magic link
// action URL, which uses the implicit OAuth flow (tokens in hash fragment)
// that the server-side callback cannot process.
setup('authenticate via OTP verification', async ({ page }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const admin = createAdminClient()

  // 1. Generate a magic link to obtain the email OTP token
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_USER_EMAIL,
  })

  if (error || !data?.properties?.email_otp) {
    throw new Error(
      `Failed to generate magic link: ${error?.message ?? 'no email_otp returned'}`,
    )
  }

  const emailOtp = data.properties.email_otp
  console.log(`[auth.setup] Got OTP for ${TEST_USER_EMAIL}`)

  // 2. Exchange the OTP for a full session (server-side, in Node)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const {
    data: { session },
    error: otpError,
  } = await supabase.auth.verifyOtp({
    email: TEST_USER_EMAIL,
    token: emailOtp,
    type: 'email',
  })

  if (otpError || !session) {
    throw new Error(`OTP verification failed: ${otpError?.message ?? 'no session returned'}`)
  }

  console.log(`[auth.setup] Session obtained, setting cookies`)

  // 3. Encode the session as a base64url cookie (matches @supabase/ssr 0.9.0 format)
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const cookieName = `sb-${projectRef}-auth-token`
  const sessionJson = JSON.stringify(session)
  const encoded = `base64-${stringToBase64URL(sessionJson)}`

  // Chunk if needed (@supabase/ssr default chunk size is ~3180 chars)
  const CHUNK_SIZE = 3180
  const cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    sameSite: 'Lax'
  }> = []

  if (encoded.length <= CHUNK_SIZE) {
    cookies.push({
      name: cookieName,
      value: encoded,
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
    })
  } else {
    for (let i = 0; i < encoded.length; i += CHUNK_SIZE) {
      cookies.push({
        name: `${cookieName}.${Math.floor(i / CHUNK_SIZE)}`,
        value: encoded.slice(i, i + CHUNK_SIZE),
        domain: 'localhost',
        path: '/',
        sameSite: 'Lax',
      })
    }
  }

  await page.context().addCookies(cookies)

  // 4. Navigate to dashboard — cookies should authenticate the request
  await page.goto('http://localhost:3000/dashboard')
  await page.waitForURL('**/dashboard**', { timeout: 30_000 })

  console.log(`[auth.setup] Authenticated — saving storageState to ${AUTH_FILE}`)

  // 5. Save cookies + localStorage for reuse by smoke test projects
  await page.context().storageState({ path: AUTH_FILE })
})
