import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createAdminClient } from '../helpers/supabase-admin'
import { TEST_USER_EMAIL, TEST_ORG_ID } from '../helpers/test-data'

// Load .env.local — Playwright doesn't auto-load it like Next.js does
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  try {
    const content = readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    throw new Error(`Cannot read ${envPath}. Ensure .env.local exists.`)
  }
}

// Runs once before all Playwright projects.
// Ensures the test user exists and is linked to the Cleanest Painting org.
async function globalSetup() {
  loadEnvLocal()
  const admin = createAdminClient()

  // 1. Ensure test user exists (idempotent)
  let userId: string

  const { data: existing } = await admin.auth.admin.listUsers()
  const found = existing?.users.find((u) => u.email === TEST_USER_EMAIL)

  if (found) {
    userId = found.id
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email: TEST_USER_EMAIL,
      email_confirm: true,
    })
    if (error) throw new Error(`Failed to create test user: ${error.message}`)
    userId = created.user.id
  }

  // 2. Ensure user_organizations link exists
  const { data: link } = await admin
    .from('user_organizations')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', TEST_ORG_ID)
    .maybeSingle()

  if (!link) {
    const { error: linkError } = await admin.from('user_organizations').insert({
      user_id: userId,
      organization_id: TEST_ORG_ID,
      role: 'owner',
      is_default: true,
    })
    if (linkError) throw new Error(`Failed to link test user to org: ${linkError.message}`)
  }

  console.log(`[global-setup] Test user ready: ${TEST_USER_EMAIL} (${userId})`)
}

export default globalSetup
