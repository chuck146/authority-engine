import { NextResponse } from 'next/server'
import { requireApiAuth, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { calculateSeoScore } from '@/lib/seo'
import { contentTypeSchema, type ContentType } from '@/types/content'
import type { StructuredContent } from '@/types/content'
import type { Json } from '@/types'

type RouteParams = {
  params: Promise<{ type: string; id: string }>
}

const TABLE_MAP = {
  service_page: 'service_pages',
  location_page: 'location_pages',
  blog_post: 'blog_posts',
} as const satisfies Record<ContentType, string>

type ContentRow = {
  id: string
  title: string
  content: Json
  keywords: string[]
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { type, id } = await params

    const typeResult = contentTypeSchema.safeParse(type)
    if (!typeResult.success) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const auth = await requireApiAuth()
    const supabase = await createClient()
    const tableName = TABLE_MAP[typeResult.data]

    const { data, error } = await supabase
      .from(tableName)
      .select('id, title, content, keywords')
      .eq('id', id)
      .eq('organization_id', auth.organizationId)
      .returns<ContentRow[]>()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const result = calculateSeoScore({
      content: data.content as unknown as StructuredContent,
      keywords: data.keywords ?? [],
      contentType: typeResult.data,
    })

    return NextResponse.json(result)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[SEO Detail Error]', err)
    return NextResponse.json({ error: 'Failed to fetch SEO details' }, { status: 500 })
  }
}
