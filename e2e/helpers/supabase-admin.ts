import { createClient } from '@supabase/supabase-js'

// Service role client — bypasses RLS. Used for test setup/teardown only.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.\n' +
        'Ensure .env.local is loaded before running E2E tests.',
    )
  }

  return createClient(url, key)
}
