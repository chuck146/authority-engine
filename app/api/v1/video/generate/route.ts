import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { generateVideoRequestSchema } from '@/types/video'
import { enqueueVideoJob } from '@/lib/queue/video-scheduler'
import type { OrgContext } from '@/packages/ai/prompts/content'
import type { OrgBranding } from '@/types'

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')

    const body = await request.json()
    const parseResult = generateVideoRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // Load org context to pass to the worker
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

    // Enqueue the video generation job (async — returns job ID)
    const jobId = await enqueueVideoJob(auth.organizationId, auth.userId, input, orgContext)

    return NextResponse.json({ jobId, status: 'queued' }, { status: 202 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }

    console.error('[Video Generation Error]', err)
    return NextResponse.json(
      { error: 'Failed to start video generation. Please try again.' },
      { status: 500 },
    )
  }
}
