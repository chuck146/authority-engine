import type { OrgContext } from '@/packages/ai/prompts/content'
import type { AuthContext, OrgBranding } from '@/types'
import type { StructuredContent, ContentListItem, ContentDetail } from '@/types/content'
import type { CalendarEntry, CalendarViewItem } from '@/types/calendar'
import type { SeoScorerInput, SeoContentItem } from '@/types/seo'
import type {
  DashboardMetrics,
  HeroMetrics,
  ContentPipeline,
  RecentActivityItem,
} from '@/types/dashboard'
import type { GenerateImageResponse, MediaLibraryItem } from '@/types/media'

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

export function buildHeroMetrics(overrides?: Partial<HeroMetrics>): HeroMetrics {
  return {
    totalPublished: 23,
    averageSeoScore: 74,
    contentInReview: 3,
    nextScheduledPublish: '2026-04-01T10:00:00Z',
    ...overrides,
  }
}

export function buildContentPipeline(overrides?: Partial<ContentPipeline>): ContentPipeline {
  return {
    statusBreakdown: { draft: 2, review: 3, approved: 1, published: 23, archived: 0 },
    totalContent: 29,
    byType: [
      { contentType: 'service_page', label: 'Service Pages', total: 8, published: 8 },
      { contentType: 'location_page', label: 'Location Pages', total: 12, published: 12 },
      { contentType: 'blog_post', label: 'Blog Posts', total: 9, published: 3 },
    ],
    ...overrides,
  }
}

export function buildRecentActivityItem(
  overrides?: Partial<RecentActivityItem>,
): RecentActivityItem {
  return {
    id: 'ra-1',
    contentType: 'service_page',
    title: 'Interior Painting',
    slug: 'interior-painting',
    status: 'published',
    publishedAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

export function buildDashboardMetrics(overrides?: Partial<DashboardMetrics>): DashboardMetrics {
  return {
    hero: buildHeroMetrics(),
    pipeline: buildContentPipeline(),
    recentActivity: [
      buildRecentActivityItem(),
      buildRecentActivityItem({
        id: 'ra-2',
        contentType: 'location_page',
        title: 'Summit, NJ',
        slug: 'summit-nj',
        publishedAt: '2026-02-28T12:00:00Z',
      }),
    ],
    ...overrides,
  }
}

export function buildGenerateImageResponse(
  overrides?: Partial<GenerateImageResponse>,
): GenerateImageResponse {
  return {
    id: 'media-1',
    imageType: 'blog_thumbnail',
    filename: 'blog-choosing-paint-colors.png',
    storagePath: 'org-456/images/blog_thumbnail/abc123.png',
    publicUrl: 'https://example.supabase.co/storage/v1/object/public/media/org-456/images/blog_thumbnail/abc123.png',
    mimeType: 'image/png',
    sizeBytes: 102400,
    width: null,
    height: null,
    altText: 'Blog thumbnail for "Choosing Paint Colors" — Cleanest Painting LLC',
    ...overrides,
  }
}

export function buildMediaLibraryItem(
  overrides?: Partial<MediaLibraryItem>,
): MediaLibraryItem {
  return {
    id: 'media-1',
    imageType: 'blog_thumbnail',
    filename: 'blog-choosing-paint-colors.png',
    publicUrl: 'https://example.supabase.co/storage/v1/object/public/media/org-456/images/blog_thumbnail/abc123.png',
    mimeType: 'image/png',
    sizeBytes: 102400,
    width: null,
    height: null,
    altText: 'Blog thumbnail for "Choosing Paint Colors" — Cleanest Painting LLC',
    createdAt: '2026-03-04T12:00:00Z',
    ...overrides,
  }
}
