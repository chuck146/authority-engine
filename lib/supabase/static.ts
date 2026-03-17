import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Cookie-free client for build-time static generation (generateStaticParams).
// Uses the anon key — relies on RLS public SELECT policies for published content.
// NEVER use this for authenticated operations.
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
