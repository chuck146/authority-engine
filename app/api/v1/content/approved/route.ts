import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { calendarContentTypeSchema } from '@/types/calendar'
import type { CalendarContentType } from '@/types/calendar'

const tableMap: Record<CalendarContentType, string> = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
  social_post: 'social_posts',
}

type ContentRow = { id: string; title: string | null; body?: string }

// GET /api/v1/content/approved?type=service_page
export async function GET(request: Request) {
  try {
    const auth = await requireApiAuth()
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const typeParam = searchParams.get('type')
    const parseResult = calendarContentTypeSchema.safeParse(typeParam)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid or missing type parameter' }, { status: 400 })
    }

    const contentType = parseResult.data
    const table = tableMap[contentType]

    const selectFields = contentType === 'social_post' ? 'id, title, body' : 'id, title'

    const { data: rows, error } = await supabase
      .from(table as never)
      .select(selectFields)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false })
      .limit(50)
      .returns<ContentRow[]>()

    if (error) throw error

    const items = (rows ?? []).map((row) => ({
      id: row.id,
      title: row.title ?? row.body?.slice(0, 80) ?? 'Untitled',
    }))

    return NextResponse.json(items)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Content Approved GET Error]', err)
    return NextResponse.json({ error: 'Failed to load approved content' }, { status: 500 })
  }
}
