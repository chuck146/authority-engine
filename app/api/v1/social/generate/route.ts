import { NextResponse } from 'next/server'
import { requireApiRole, AuthError } from '@/lib/auth/api-guard'
import { createClient } from '@/lib/supabase/server'
import { generateSocialPost } from '@/lib/ai/social-generator'
import { generateAndStoreImage } from '@/lib/ai/image-generator'
import { generateSocialPostRequestSchema } from '@/types/social'
import type { SocialPostResponse } from '@/types/social'
import type { OrgContext } from '@/packages/ai/prompts/content/shared'
import type { OrgBranding, Json } from '@/types'

export async function POST(request: Request) {
  try {
    const auth = await requireApiRole('editor')

    const body = await request.json()
    const parseResult = generateSocialPostRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const input = parseResult.data

    // Load organization context
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

    // Generate social post via Claude
    const generated = await generateSocialPost(input, orgContext)

    // Optionally generate an accompanying image
    let mediaAssetId: string | null = null
    if (input.generateImage && generated.image_prompt) {
      try {
        const imageResult = await generateAndStoreImage(
          {
            imageType: 'social_graphic',
            message: generated.image_prompt,
            style: 'photorealistic',
            mood: 'warm',
          },
          orgContext,
          auth.organizationId,
          auth.userId,
        )
        mediaAssetId = imageResult.id
      } catch (imgError) {
        console.warn(
          '[Social Generate] Image generation failed, continuing without image:',
          imgError,
        )
      }
    }

    // Build title from topic
    const title = input.topic.slice(0, 200)

    // Insert into social_posts
    const { data, error } = await supabase
      .from('social_posts' as never)
      .insert({
        organization_id: auth.organizationId,
        platform: input.platform,
        post_type: input.platform === 'gbp' ? input.postType : 'update',
        title,
        body: generated.body,
        hashtags: generated.hashtags,
        cta_type:
          generated.cta_type ??
          (input.platform === 'gbp' && 'ctaType' in input ? input.ctaType : null),
        cta_url:
          generated.cta_url ??
          (input.platform === 'gbp' && 'ctaUrl' in input ? input.ctaUrl : null),
        media_asset_id: mediaAssetId,
        status: 'review',
        keywords: input.keywords ?? [],
        metadata: {} as unknown as Json,
        created_by: auth.userId,
      } as never)
      .select('id')
      .single()

    if (error) throw error

    const response: SocialPostResponse = {
      id: (data as { id: string }).id,
      platform: input.platform,
      postType: input.platform === 'gbp' ? input.postType : 'update',
      title,
      body: generated.body,
      hashtags: generated.hashtags,
      ctaType: generated.cta_type ?? null,
      ctaUrl: generated.cta_url ?? null,
      mediaAssetId,
      status: 'review',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    console.error('[Social Post Generation Error]', err)
    return NextResponse.json(
      { error: 'Failed to generate social post. Please try again.' },
      { status: 500 },
    )
  }
}
