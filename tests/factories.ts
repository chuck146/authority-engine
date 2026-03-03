import type { OrgContext } from '@/packages/ai/prompts/content'
import type { AuthContext, OrgBranding } from '@/types'
import type { StructuredContent, ContentListItem } from '@/types/content'

export function buildOrgContext(overrides?: Partial<OrgContext>): OrgContext {
  return {
    orgName: 'Cleanest Painting LLC',
    domain: 'cleanestpainting.com',
    branding: {
      primary: '#1a472a',
      secondary: '#fbbf24',
      accent: '#1e3a5f',
      tagline: 'Where Artistry Meets Craftsmanship',
    } satisfies OrgBranding,
    serviceAreaStates: ['NJ'],
    serviceAreaCounties: ['Union', 'Essex', 'Morris'],
    ...overrides,
  }
}

export function buildAuthContext(overrides?: Partial<AuthContext>): AuthContext {
  return {
    userId: 'user-123',
    organizationId: 'org-456',
    role: 'editor',
    ...overrides,
  }
}

export function buildStructuredContent(overrides?: Partial<StructuredContent>): StructuredContent {
  return {
    headline: 'Professional Interior Painting Services',
    intro: 'Transform your home with expert interior painting.',
    sections: [
      {
        title: 'Why Choose Us',
        body: '<p>We deliver exceptional results with premium materials.</p>',
      },
      {
        title: 'Our Process',
        body: '<p>From consultation to final walkthrough, we ensure quality.</p>',
      },
    ],
    cta: 'Get your free estimate today!',
    meta_title: 'Interior Painting | Cleanest Painting',
    meta_description: 'Professional interior painting in NJ. Free estimates. Premium paints.',
    ...overrides,
  }
}

export function buildContentListItem(overrides?: Partial<ContentListItem>): ContentListItem {
  return {
    id: 'item-1',
    type: 'service_page',
    title: 'Interior Painting',
    slug: 'interior-painting',
    status: 'review',
    seoScore: null,
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}
