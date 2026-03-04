import type { OrgContext } from '@/packages/ai/prompts/content'
import type { AuthContext, OrgBranding } from '@/types'
import type { StructuredContent, ContentListItem, ContentDetail } from '@/types/content'
import type { CalendarEntry, CalendarViewItem } from '@/types/calendar'
import type { SeoScorerInput, SeoContentItem } from '@/types/seo'

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

export function buildContentDetail(overrides?: Partial<ContentDetail>): ContentDetail {
  return {
    id: 'detail-1',
    type: 'service_page',
    title: 'Interior Painting',
    slug: 'interior-painting',
    status: 'review',
    content: buildStructuredContent(),
    seoScore: null,
    keywords: ['interior painting', 'house painting'],
    metaTitle: 'Interior Painting | Cleanest Painting',
    metaDescription: 'Professional interior painting in NJ.',
    approvedBy: null,
    approvedAt: null,
    rejectionNote: null,
    publishedAt: null,
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z',
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

export function buildCalendarEntry(overrides?: Partial<CalendarEntry>): CalendarEntry {
  return {
    id: 'cal-1',
    organization_id: 'org-456',
    content_type: 'service_page',
    content_id: 'content-789',
    scheduled_at: '2026-04-01T10:00:00Z',
    published_at: null,
    status: 'scheduled',
    error_message: null,
    created_by: 'user-123',
    created_at: '2026-03-15T12:00:00Z',
    updated_at: '2026-03-15T12:00:00Z',
    ...overrides,
  }
}

export function buildCalendarViewItem(overrides?: Partial<CalendarViewItem>): CalendarViewItem {
  return {
    id: 'cal-1',
    contentType: 'service_page',
    contentId: 'content-789',
    contentTitle: 'Interior Painting',
    scheduledAt: '2026-04-01T10:00:00Z',
    publishedAt: null,
    status: 'scheduled',
    errorMessage: null,
    ...overrides,
  }
}

export function buildSeoScorerInput(overrides?: Partial<SeoScorerInput>): SeoScorerInput {
  return {
    content: buildStructuredContent(),
    keywords: ['interior painting'],
    contentType: 'service_page',
    ...overrides,
  }
}

export function buildSeoContentItem(overrides?: Partial<SeoContentItem>): SeoContentItem {
  return {
    id: 'sp-1',
    contentType: 'service_page',
    title: 'Interior Painting',
    slug: 'interior-painting',
    status: 'published',
    seoScore: 72,
    topIssue: null,
    ...overrides,
  }
}
