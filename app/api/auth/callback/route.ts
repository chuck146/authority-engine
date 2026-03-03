import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      },
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
