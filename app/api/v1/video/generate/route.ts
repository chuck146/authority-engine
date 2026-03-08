import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import {
  generateVeoRequestSchema,
  generateRemotionRequestSchema,
  isRemotionVideoType,
} from '@/types/video'
import { enqueueVideoJob } from '@/lib/queue/video-scheduler'
import { enqueueRemotionJob } from '@/lib/queue/remotion-scheduler'
import type { OrgContext } from '@/packages/ai/prompts/content'
import type { OrgBranding } from '@/types'
import type { CompositionId } from '@/services/video/src/types'
import { COMPOSITION_IDS } from '@/services/video/src/types'

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')

    const body = await request.json()
    const videoType = body.videoType as string | undefined

    if (!videoType) {
      return NextResponse.json({ error: 'videoType is required' }, { status: 400 })
    }

    // Load org context (needed for both engines)
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

    // Route to correct engine based on videoType
    if (isRemotionVideoType(videoType)) {
      // --- Remotion engine ---
      const parseResult = generateRemotionRequestSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
          { status: 400 },
        )
      }

      const input = parseResult.data
      const { compositionId, inputProps } = mapToRemotionComposition(input, orgContext, branding)

      const jobId = await enqueueRemotionJob(
        auth.organizationId,
        auth.userId,
        compositionId,
        inputProps,
        input.videoType,
      )

      return NextResponse.json({ jobId, status: 'queued', engine: 'remotion' }, { status: 202 })
    } else {
      // --- Veo engine ---
      const parseResult = generateVeoRequestSchema.safeParse(body)
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
          { status: 400 },
        )
      }

      const input = parseResult.data
      const jobId = await enqueueVideoJob(auth.organizationId, auth.userId, input, orgContext)

      return NextResponse.json({ jobId, status: 'queued', engine: 'veo' }, { status: 202 })
    }
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

/** Map a Remotion request to a compositionId + inputProps for the Remotion worker */
function mapToRemotionComposition(
  input: { videoType: string } & Record<string, unknown>,
  orgContext: OrgContext,
  branding: OrgBranding | null,
): { compositionId: CompositionId; inputProps: Record<string, unknown> } {
  const brand = {
    orgName: orgContext.orgName,
    tagline: branding?.tagline ?? undefined,
    primaryColor: branding?.primary ?? '#1B2B5B',
    secondaryColor: branding?.secondary ?? '#fbbf24',
    accentColor: branding?.accent ?? '#1e3a5f',
  }

  switch (input.videoType) {
    case 'testimonial_quote':
      return {
        compositionId: COMPOSITION_IDS.TESTIMONIAL_QUOTE,
        inputProps: {
          brand,
          quote: input.quote as string,
          customerName: input.customerName as string,
          starRating: input.starRating as number | undefined,
        },
      }
    case 'tip_video':
      return {
        compositionId: COMPOSITION_IDS.TIP_VIDEO,
        inputProps: {
          brand,
          title: input.title as string,
          tips: input.tips as Array<{ number: number; text: string }>,
        },
      }
    case 'before_after_reveal':
      return {
        compositionId: COMPOSITION_IDS.BEFORE_AFTER_REVEAL,
        inputProps: {
          brand,
          beforeImageUrl: input.beforeImageUrl as string,
          afterImageUrl: input.afterImageUrl as string,
          location: input.location as string | undefined,
        },
      }
    case 'branded_intro':
      return {
        compositionId: COMPOSITION_IDS.BRANDED_INTRO_OUTRO,
        inputProps: {
          brand,
          mode: 'intro' as const,
        },
      }
    case 'branded_outro':
      return {
        compositionId: COMPOSITION_IDS.BRANDED_INTRO_OUTRO,
        inputProps: {
          brand,
          mode: 'outro' as const,
          ctaText: input.ctaText as string | undefined,
          ctaUrl: input.ctaUrl as string | undefined,
        },
      }
    default:
      throw new Error(`Unknown Remotion video type: ${input.videoType}`)
  }
}
