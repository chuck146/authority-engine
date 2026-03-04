import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { generateContent } from '@/lib/ai'
import { generateSlug, generateTitleFromInput } from '@/lib/ai/utils'
import { generateContentRequestSchema, type GenerateContentResponse } from '@/types/content'
import type { OrgContext } from '@/packages/ai/prompts/content'
import type { OrgBranding, Json } from '@/types'

type OrgRow = {
  name: string
  domain: string | null
  branding: Json
  settings: Json
}

type IdRow = { id: string }

export async function POST(request: Request) {
  try {
    // 1. Auth: require at least editor role to generate content
    const auth = await requireApiRole('editor')

    // 2. Parse and validate request body
    const body = await request.json()
    const parseResult = generateContentRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // 3. Load organization context for prompt template
    const supabase = await createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('name, domain, branding, settings')
      .eq('id', auth.organizationId)
      .returns<OrgRow[]>()
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const branding = org.branding as OrgBranding | null
    const settings = org.settings as Record<string, unknown> | null

    const orgContext: OrgContext = {
      orgName: org.name,
      domain: org.domain,
      branding,
      serviceAreaStates: (settings?.service_area_states as string[]) ?? undefined,
      serviceAreaCounties: (settings?.service_area_counties as string[]) ?? undefined,
    }

    // 4. Generate content via Claude
    const structuredContent = await generateContent(input, orgContext)

    // 5. Build title and slug
    const title =
      input.contentType === 'blog_post' ? structuredContent.headline : generateTitleFromInput(input)
    const slug = generateSlug(title)

    // 6. Save to the correct table
    // Note: using .rpc or raw insert with .returns<> to work around hand-written Database types
    let insertedId: string

    switch (input.contentType) {
      case 'service_page': {
        const { data, error } = await supabase
          .from('service_pages')
          .insert({
            organization_id: auth.organizationId,
            title,
            slug,
            meta_title: structuredContent.meta_title,
            meta_description: structuredContent.meta_description,
            content: structuredContent as unknown as Json,
            status: 'review' as const,
            keywords: input.targetKeywords ?? [],
            created_by: auth.userId,
          } as never)
          .select('id')
          .returns<IdRow[]>()
          .single()

        if (error) throw error
        insertedId = data.id
        break
      }
      case 'location_page': {
        const { data, error } = await supabase
          .from('location_pages')
          .insert({
            organization_id: auth.organizationId,
            title,
            slug,
            city: input.city,
            state: input.state,
            meta_title: structuredContent.meta_title,
            meta_description: structuredContent.meta_description,
            content: structuredContent as unknown as Json,
            status: 'review' as const,
            keywords: input.targetKeywords ?? [],
            created_by: auth.userId,
          } as never)
          .select('id')
          .returns<IdRow[]>()
          .single()

        if (error) throw error
        insertedId = data.id
        break
      }
      case 'blog_post': {
        const wordCount = [
          structuredContent.intro,
          ...structuredContent.sections.map((s) => s.body),
          structuredContent.cta,
        ]
          .join(' ')
          .split(/\s+/).length
        const readingTime = Math.max(1, Math.ceil(wordCount / 200))

        const { data, error } = await supabase
          .from('blog_posts')
          .insert({
            organization_id: auth.organizationId,
            title,
            slug,
            excerpt: structuredContent.intro.slice(0, 200),
            meta_title: structuredContent.meta_title,
            meta_description: structuredContent.meta_description,
            content: structuredContent as unknown as Json,
            status: 'review' as const,
            keywords: input.targetKeywords ?? [],
            category: input.category ?? null,
            reading_time_minutes: readingTime,
            created_by: auth.userId,
          } as never)
          .select('id')
          .returns<IdRow[]>()
          .single()

        if (error) throw error
        insertedId = data.id
        break
      }
    }

    // 7. Return response
    const response: GenerateContentResponse = {
      id: insertedId,
      contentType: input.contentType,
      title,
      slug,
      content: structuredContent,
      status: 'review',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error('[Content Generation Error]', err)

    // Handle Supabase unique constraint violations (duplicate slug)
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      return NextResponse.json(
        { error: 'A page with this slug already exists. Try a different title.' },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 },
    )
  }
}
