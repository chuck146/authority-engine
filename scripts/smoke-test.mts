/**
 * E2E Smoke Test — Authority Engine
 *
 * Tests the full content lifecycle against the live dev server + Supabase:
 *   generate → edit → approve → publish → SSR render
 *
 * Prerequisites:
 *   1. Dev server running: npm run dev
 *   2. Supabase migrations + seed applied
 *   3. Custom access token hook enabled in Supabase Dashboard
 *      (Authentication → Hooks → Custom Access Token → public.custom_access_token_hook)
 *
 * Usage:
 *   npx tsx scripts/smoke-test.mts              # full flow (requires valid ANTHROPIC_API_KEY)
 *   npx tsx scripts/smoke-test.mts --skip-generate  # skip Claude API, use seed data
 */

import { readFileSync } from 'node:fs'
import { createClient, type Session } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Load .env.local
// ---------------------------------------------------------------------------
const envContent = readFileSync('.env.local', 'utf-8')
for (const line of envContent.split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eqIdx = trimmed.indexOf('=')
  if (eqIdx < 0) continue
  const key = trimmed.slice(0, eqIdx).trim()
  const val = trimmed.slice(eqIdx + 1).trim()
  if (!process.env[key]) process.env[key] = val
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

const ORG_ID = '00000000-0000-0000-0000-000000000001' // Cleanest Painting
const TEST_EMAIL = 'smoke-test@authority-engine.test'
const TEST_PASSWORD = 'SmOkE_T3st!2026'

const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0]
const COOKIE_NAME = `sb-${projectRef}-auth-token`

const SKIP_GENERATE = process.argv.includes('--skip-generate')

// ---------------------------------------------------------------------------
// Supabase clients
// ---------------------------------------------------------------------------
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeCookie(session: Session): string {
  const json = JSON.stringify(session)
  const b64 = Buffer.from(json).toString('base64url')
  return `${COOKIE_NAME}=base64-${b64}`
}

function log(step: string, msg: string) {
  console.log(`  [${step}] ${msg}`)
}

function pass(step: string) {
  console.log(`  ✅ ${step} — PASSED`)
}

function fail(step: string, reason: string): never {
  console.error(`  ❌ ${step} — FAILED: ${reason}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Pre-flight
// ---------------------------------------------------------------------------
async function preflight() {
  console.log('\n🔍 Pre-flight Checks\n')

  // Check required env vars
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    fail('Env', 'Missing SUPABASE_URL, SERVICE_ROLE_KEY, or ANON_KEY in .env.local')
  }

  // Check dev server
  try {
    const res = await fetch(BASE_URL, { redirect: 'manual' })
    log('Server', `Dev server responding (status ${res.status})`)
  } catch {
    fail('Server', `Dev server not running at ${BASE_URL}. Run 'npm run dev' first.`)
  }

  // Check Supabase connection + seed data
  const { data: orgs, error: orgErr } = await admin
    .from('organizations')
    .select('id, name')
    .eq('id', ORG_ID)
    .single()

  if (orgErr || !orgs) fail('Supabase', `Org not found. Run db:seed. (${orgErr?.message})`)
  log('Supabase', `Connected — org: ${orgs.name}`)

  pass('Pre-flight')
}

// ---------------------------------------------------------------------------
// Setup test user
// ---------------------------------------------------------------------------
async function setupUser(): Promise<Session> {
  console.log('\n👤 Setup Test User\n')

  // Check if user already exists
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 100 })
  const existing = listData?.users.find((u) => u.email === TEST_EMAIL)

  let userId: string

  if (existing) {
    log('User', `Already exists: ${existing.id}`)
    userId = existing.id
    // Ensure password is set (in case user was created without one)
    await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD })
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    if (error) fail('Create User', error.message)
    userId = data.user.id
    log('User', `Created: ${userId}`)
  }

  // Ensure user_organizations record
  const { data: membership } = await admin
    .from('user_organizations')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', ORG_ID)
    .maybeSingle()

  if (!membership) {
    const { error } = await admin.from('user_organizations').insert({
      user_id: userId,
      organization_id: ORG_ID,
      role: 'owner',
      is_default: true,
    })
    if (error) fail('Membership', error.message)
    log('Membership', 'Created (owner role)')
  } else {
    log('Membership', 'Already exists')
  }

  // Sign in to get session
  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInErr) {
    fail(
      'Sign In',
      `${signInErr.message}. If password auth is disabled, enable it in Supabase Dashboard → Authentication → Providers → Email.`,
    )
  }

  log('Session', `Token: ${signIn.session.access_token.substring(0, 30)}...`)

  // Verify JWT contains org_id (custom access token hook)
  const payload = JSON.parse(
    Buffer.from(signIn.session.access_token.split('.')[1], 'base64').toString(),
  )
  const jwtOrgId = payload?.app_metadata?.organization_id

  if (jwtOrgId) {
    log('JWT', `app_metadata.organization_id = ${jwtOrgId}`)
    pass('Setup')
  } else {
    console.warn('\n  ⚠️  WARNING: JWT missing app_metadata.organization_id!')
    console.warn('     The custom access token hook is not enabled.')
    console.warn('     RLS will block all authenticated content queries.\n')
    console.warn('     To fix, go to Supabase Dashboard:')
    console.warn('       Authentication → Hooks → Custom Access Token')
    console.warn('       Schema: public')
    console.warn('       Function: custom_access_token_hook\n')
    console.warn('     Enable it, then re-run this test.\n')
    fail('JWT', 'Custom access token hook not enabled — cannot proceed')
  }

  return signIn.session
}

// ---------------------------------------------------------------------------
// Step 1: Generate content (calls Claude API)
// ---------------------------------------------------------------------------
async function testGenerate(cookie: string): Promise<{ id: string; slug: string }> {
  console.log('\n📝 Step 1: Generate Content (via Claude API)\n')

  const res = await fetch(`${BASE_URL}/api/v1/content/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      contentType: 'service_page',
      serviceName: 'Smoke Test Painting',
      serviceDescription:
        'Professional interior and exterior painting services. This is a test page generated during the E2E smoke test.',
      targetKeywords: ['smoke test', 'painting services'],
      tone: 'professional',
    }),
  })

  const data = await res.json()

  if (!res.ok) fail('Generate', `${res.status}: ${JSON.stringify(data)}`)

  log('Generate', `ID: ${data.id}`)
  log('Generate', `Title: ${data.title}`)
  log('Generate', `Slug: ${data.slug}`)
  log('Generate', `Status: ${data.status}`)
  log('Generate', `Sections: ${data.content?.sections?.length ?? 0}`)

  if (data.status !== 'review') fail('Generate', `Expected status 'review', got '${data.status}'`)

  pass('Generate')
  return { id: data.id, slug: data.slug }
}

// ---------------------------------------------------------------------------
// Step 2: Edit content
// ---------------------------------------------------------------------------
async function testEdit(cookie: string, id: string, slug: string): Promise<string> {
  console.log('\n✏️  Step 2: Edit Content\n')

  const editedSlug = `${slug}-edited`

  const res = await fetch(`${BASE_URL}/api/v1/content/service_page/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      title: 'Smoke Test Painting (Edited)',
      slug: editedSlug,
      metaTitle: 'Smoke Test Painting | Edited',
    }),
  })

  const data = await res.json()

  if (!res.ok) fail('Edit', `${res.status}: ${JSON.stringify(data)}`)

  log('Edit', `Title: ${data.title}`)
  log('Edit', `Slug: ${data.slug}`)
  log('Edit', `Status: ${data.status}`)

  if (data.status !== 'review') fail('Edit', `Expected status 'review', got '${data.status}'`)

  pass('Edit')
  return editedSlug
}

// ---------------------------------------------------------------------------
// Step 3: Approve content
// ---------------------------------------------------------------------------
async function testApprove(cookie: string, id: string) {
  console.log('\n✅ Step 3: Approve Content\n')

  const res = await fetch(`${BASE_URL}/api/v1/content/service_page/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'approve' }),
  })

  const data = await res.json()

  if (!res.ok) fail('Approve', `${res.status}: ${JSON.stringify(data)}`)

  log('Approve', `Status: ${data.status}, Action: ${data.action}`)

  if (data.status !== 'approved') fail('Approve', `Expected 'approved', got '${data.status}'`)

  pass('Approve')
}

// ---------------------------------------------------------------------------
// Step 4: Publish content
// ---------------------------------------------------------------------------
async function testPublish(cookie: string, id: string) {
  console.log('\n🚀 Step 4: Publish Content\n')

  const res = await fetch(`${BASE_URL}/api/v1/content/service_page/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ action: 'publish' }),
  })

  const data = await res.json()

  if (!res.ok) fail('Publish', `${res.status}: ${JSON.stringify(data)}`)

  log('Publish', `Status: ${data.status}, Action: ${data.action}`)

  if (data.status !== 'published') fail('Publish', `Expected 'published', got '${data.status}'`)

  pass('Publish')
}

// ---------------------------------------------------------------------------
// Step 5: Verify SSR render
// ---------------------------------------------------------------------------
async function testSSR(slug: string, titleFragment: string) {
  console.log('\n🌐 Step 5: SSR Page Render\n')

  // Small delay to let ISR generate on first hit
  await new Promise((r) => setTimeout(r, 1000))

  const res = await fetch(`${BASE_URL}/services/${slug}`)

  if (res.status === 404) fail('SSR', `404 at /services/${slug} — page not found`)
  if (!res.ok) fail('SSR', `${res.status} at /services/${slug}`)

  const html = await res.text()

  log('SSR', `Status: ${res.status}`)
  log('SSR', `HTML length: ${html.length} chars`)

  // Check that page contains meaningful content
  const hasTitle = html.includes(titleFragment)
  const hasContent = html.length > 500

  log('SSR', `Contains '${titleFragment}': ${hasTitle}`)
  log('SSR', `Has substantial HTML: ${hasContent}`)

  if (!hasTitle) fail('SSR', `Page HTML does not contain '${titleFragment}'`)
  if (!hasContent) fail('SSR', 'Page HTML is too short — likely not rendering content')

  pass('SSR')
}

// ---------------------------------------------------------------------------
// Seed fallback: use existing "review" content when --skip-generate
// ---------------------------------------------------------------------------
async function getSeedData(): Promise<{ id: string; slug: string; title: string }> {
  console.log('\n📦 Using Seed Data (--skip-generate)\n')

  const { data, error } = await admin
    .from('service_pages')
    .select('id, title, slug, status')
    .eq('organization_id', ORG_ID)
    .eq('status', 'review')
    .limit(1)
    .single()

  if (error || !data) fail('Seed', `No service page in "review" status found: ${error?.message}`)

  log('Seed', `Using: "${data.title}" (${data.id})`)
  log('Seed', `Slug: ${data.slug}, Status: ${data.status}`)

  pass('Seed Data')
  return { id: data.id, slug: data.slug, title: data.title }
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------
async function cleanup(id: string, restore?: { slug: string; title: string }) {
  console.log('\n🧹 Cleanup\n')

  if (restore) {
    // Restore seed data to original state (review status, original title/slug)
    const { error } = await admin
      .from('service_pages')
      .update({
        status: 'review',
        title: restore.title,
        slug: restore.slug,
        approved_by: null,
        approved_at: null,
        published_at: null,
      })
      .eq('id', id)

    if (error) {
      log('Cleanup', `Warning: could not restore seed page — ${error.message}`)
    } else {
      log('Cleanup', `Restored seed page to review status (slug: ${restore.slug})`)
    }
  } else {
    // Delete generated content
    const { error } = await admin.from('service_pages').delete().eq('id', id)

    if (error) {
      log('Cleanup', `Warning: could not delete test page — ${error.message}`)
    } else {
      log('Cleanup', 'Deleted test service page')
    }
  }

  pass('Cleanup')
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n═══════════════════════════════════════════')
  console.log('  Authority Engine — E2E Smoke Test')
  if (SKIP_GENERATE) console.log('  (--skip-generate: using seed data)')
  console.log('═══════════════════════════════════════════')

  const start = Date.now()

  await preflight()
  const session = await setupUser()
  const cookie = makeCookie(session)

  let id: string
  let slug: string
  let titleFragment: string
  let restoreInfo: { slug: string; title: string } | undefined

  if (SKIP_GENERATE) {
    const seed = await getSeedData()
    id = seed.id
    slug = seed.slug
    titleFragment = seed.title
    restoreInfo = { slug: seed.slug, title: seed.title }
  } else {
    const generated = await testGenerate(cookie)
    id = generated.id
    slug = generated.slug
    titleFragment = 'Smoke Test'
  }

  const editedSlug = await testEdit(cookie, id, slug)
  await testApprove(cookie, id)
  await testPublish(cookie, id)
  await testSSR(editedSlug, titleFragment)
  await cleanup(id, restoreInfo)

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)

  console.log('\n═══════════════════════════════════════════')
  console.log(`  🎉 ALL TESTS PASSED (${elapsed}s)`)
  console.log('═══════════════════════════════════════════\n')
}

main().catch((err) => {
  console.error('\n💥 Unexpected error:', err)
  process.exit(1)
})
