import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { getValidToken } from '@/lib/google/token-manager'
import { fetchSitemaps } from '@/lib/google/search-console'
import type { GscSitemap } from '@/types/gsc'

export async function GET() {
  try {
    const auth = await requireApiAuth()
    const { accessToken, siteUrl } = await getValidToken(auth.organizationId)
    const raw = await fetchSitemaps({ accessToken, siteUrl })

    const sitemaps: GscSitemap[] = raw.map((s) => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted ?? null,
      isPending: s.isPending,
      lastDownloaded: s.lastDownloaded ?? null,
      warnings: parseInt(s.warnings) || 0,
      errors: parseInt(s.errors) || 0,
      contents: (s.contents ?? []).map((c) => ({
        type: c.type,
        submitted: parseInt(c.submitted) || 0,
        indexed: parseInt(c.indexed) || 0,
      })),
    }))

    return NextResponse.json({ sitemaps })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[GSC Sitemaps Error]', err)
    return NextResponse.json({ error: 'Failed to fetch sitemaps' }, { status: 500 })
  }
}
