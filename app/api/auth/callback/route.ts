import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

function sanitizeRedirect(input: string | null): string {
  if (!input || !input.startsWith('/') || input.startsWith('//') || input.includes('\\')) {
    return '/dashboard'
  }
  return input
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = sanitizeRedirect(searchParams.get('redirect'))

  if (code) {
    const response = NextResponse.redirect(`${origin}${redirect}`)

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const header = request.headers.get('cookie') ?? ''
            return header
              .split(';')
              .filter(Boolean)
              .map((c) => {
                const [name, ...rest] = c.trim().split('=')
                return { name, value: decodeURIComponent(rest.join('=')) }
              })
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Auto-link user to organization if not already linked
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const admin = createAdminClient()

        // Check if user already has an org membership
        const { data: existing } = await admin
          .from('user_organizations')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle()

        if (!existing) {
          // Find the first organization (MVP: single-tenant)
          const { data: org } = await admin
            .from('organizations')
            .select('id')
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

          if (org) {
            await admin.from('user_organizations').insert({
              user_id: user.id,
              organization_id: org.id,
              role: 'owner',
              is_default: true,
            })
          }
        }
      }

      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
