import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { generateAndStoreImage } from '@/lib/ai'
import { generateImageRequestSchema } from '@/types/media'
import type { OrgContext } from '@/packages/ai/prompts/content'
import type { OrgBranding } from '@/types'

export async function POST(request: Request) {
  try {
    // 1. Auth: require at least editor role
    const auth = await requireApiRole('editor')

    // 2. Parse and validate request body
    const body = await request.json()
    const parseResult = generateImageRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // 3. Load organization context
    const supabase = await createClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('name, domain, branding, settings')
      .eq('id', auth.organizationId)
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

    // 4. Generate image, upload, and store
    const result = await generateAndStoreImage(input, orgContext, auth.organizationId, auth.userId)

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error('[Image Generation Error]', err)
    return NextResponse.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 },
    )
  }
}
