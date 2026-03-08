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
import type {
  GscSummary,
  KeywordRankingItem,
  PagePerformanceItem,
  GscSitemap,
  GscOverview,
  UrlInspectionResult,
  IndexingCoverage,
} from '@/types/gsc'
import type {
  Ga4Summary,
  Ga4TrafficTrendPoint,
  Ga4PageMetric,
  Ga4TrafficSource,
  Ga4DeviceBreakdown,
  Ga4Overview,
} from '@/types/ga4'
import type { SocialPostListItem, SocialPostDetail, SocialPostContent } from '@/types/social'
import type {
  ReviewListItem,
  ReviewDetail,
  ReviewResponseContent,
  ReviewOverview,
} from '@/types/reviews'
import type {
  ReviewRequestListItem,
  ReviewRequestDetail,
  ReviewRequestOverview,
} from '@/types/review-requests'
import type { GenerateVideoResponse, VideoLibraryItem, VideoJobStatus } from '@/types/video'
import type {
  KeywordRankingListItem,
  KeywordTrendPoint,
  AnalyticsOverview,
  KeywordSummary,
} from '@/types/analytics'

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
    publicUrl:
      'https://example.supabase.co/storage/v1/object/public/media/org-456/images/blog_thumbnail/abc123.png',
    mimeType: 'image/png',
    sizeBytes: 102400,
    width: null,
    height: null,
    altText: 'Blog thumbnail for "Choosing Paint Colors" — Cleanest Painting LLC',
    ...overrides,
  }
}

export function buildMediaLibraryItem(overrides?: Partial<MediaLibraryItem>): MediaLibraryItem {
  return {
    id: 'media-1',
    imageType: 'blog_thumbnail',
    filename: 'blog-choosing-paint-colors.png',
    publicUrl:
      'https://example.supabase.co/storage/v1/object/public/media/org-456/images/blog_thumbnail/abc123.png',
    mimeType: 'image/png',
    sizeBytes: 102400,
    width: null,
    height: null,
    altText: 'Blog thumbnail for "Choosing Paint Colors" — Cleanest Painting LLC',
    createdAt: '2026-03-04T12:00:00Z',
    ...overrides,
  }
}

// --- GSC Factories ---

export function buildGscSummary(overrides?: Partial<GscSummary>): GscSummary {
  return {
    clicks: 1250,
    impressions: 45000,
    ctr: 0.028,
    position: 18.3,
    clicksTrend: 12,
    impressionsTrend: 8,
    ctrTrend: 4,
    positionTrend: -5,
    ...overrides,
  }
}

export function buildKeywordRankingItem(
  overrides?: Partial<KeywordRankingItem>,
): KeywordRankingItem {
  return {
    query: 'interior painting nj',
    clicks: 85,
    impressions: 2400,
    ctr: 0.035,
    position: 8.2,
    positionChange: 1.3,
    ...overrides,
  }
}

export function buildPagePerformanceItem(
  overrides?: Partial<PagePerformanceItem>,
): PagePerformanceItem {
  return {
    page: 'https://cleanestpainting.com/services/interior-painting',
    clicks: 120,
    impressions: 3200,
    ctr: 0.038,
    position: 6.5,
    ...overrides,
  }
}

export function buildGscSitemap(overrides?: Partial<GscSitemap>): GscSitemap {
  return {
    path: 'https://cleanestpainting.com/sitemap.xml',
    lastSubmitted: '2026-03-01T00:00:00Z',
    isPending: false,
    lastDownloaded: '2026-03-04T00:00:00Z',
    warnings: 0,
    errors: 0,
    contents: [{ type: 'web', submitted: 45, indexed: 38 }],
    ...overrides,
  }
}

export function buildIndexingCoverage(overrides?: Partial<IndexingCoverage>): IndexingCoverage {
  return {
    valid: 38,
    warnings: 0,
    errors: 2,
    excluded: 7,
    ...overrides,
  }
}

export function buildGscOverview(overrides?: Partial<GscOverview>): GscOverview {
  return {
    isConnected: true,
    siteUrl: 'https://cleanestpainting.com',
    lastSyncedAt: '2026-03-05T12:00:00Z',
    summary: buildGscSummary(),
    topQueries: [buildKeywordRankingItem()],
    topPages: [buildPagePerformanceItem()],
    sitemaps: [buildGscSitemap()],
    indexingCoverage: buildIndexingCoverage(),
    ...overrides,
  }
}

export function buildUrlInspectionResult(
  overrides?: Partial<UrlInspectionResult>,
): UrlInspectionResult {
  return {
    inspectionUrl: 'https://cleanestpainting.com/services/interior-painting',
    indexingState: 'INDEXING_ALLOWED',
    coverageState: 'SUBMITTED_AND_INDEXED',
    lastCrawlTime: '2026-03-04T08:00:00Z',
    crawlAllowed: true,
    robotsTxtState: 'ALLOWED',
    pageFetchState: 'SUCCESSFUL',
    mobileUsability: 'MOBILE_FRIENDLY',
    richResults: [],
    ...overrides,
  }
}

// --- GA4 Factories ---

export function buildGa4Summary(overrides?: Partial<Ga4Summary>): Ga4Summary {
  return {
    sessions: 3200,
    users: 2100,
    pageviews: 8500,
    bounceRate: 0.42,
    sessionsTrend: 15,
    usersTrend: 12,
    pageviewsTrend: 18,
    bounceRateTrend: -3,
    ...overrides,
  }
}

export function buildGa4TrafficTrendPoint(
  overrides?: Partial<Ga4TrafficTrendPoint>,
): Ga4TrafficTrendPoint {
  return {
    date: '2026-03-04',
    sessions: 120,
    users: 85,
    pageviews: 310,
    ...overrides,
  }
}

export function buildGa4PageMetric(overrides?: Partial<Ga4PageMetric>): Ga4PageMetric {
  return {
    pagePath: '/services/interior-painting',
    pageTitle: 'Interior Painting | Cleanest Painting',
    sessions: 150,
    users: 120,
    pageviews: 280,
    bounceRate: 0.38,
    avgSessionDuration: 125.4,
    ...overrides,
  }
}

export function buildGa4TrafficSource(overrides?: Partial<Ga4TrafficSource>): Ga4TrafficSource {
  return {
    source: 'google',
    medium: 'organic',
    sessions: 1800,
    users: 1200,
    bounceRate: 0.35,
    ...overrides,
  }
}

export function buildGa4DeviceBreakdown(
  overrides?: Partial<Ga4DeviceBreakdown>,
): Ga4DeviceBreakdown {
  return {
    deviceCategory: 'desktop',
    sessions: 1600,
    users: 1050,
    percentage: 50,
    ...overrides,
  }
}

export function buildGa4Overview(overrides?: Partial<Ga4Overview>): Ga4Overview {
  return {
    isConnected: true,
    propertyId: 'properties/123456789',
    lastSyncedAt: '2026-03-05T12:00:00Z',
    summary: buildGa4Summary(),
    dailyTrend: [buildGa4TrafficTrendPoint()],
    topPages: [buildGa4PageMetric()],
    trafficSources: [buildGa4TrafficSource()],
    deviceBreakdown: [
      buildGa4DeviceBreakdown(),
      buildGa4DeviceBreakdown({
        deviceCategory: 'mobile',
        sessions: 1200,
        users: 800,
        percentage: 37.5,
      }),
      buildGa4DeviceBreakdown({
        deviceCategory: 'tablet',
        sessions: 400,
        users: 250,
        percentage: 12.5,
      }),
    ],
    ...overrides,
  }
}

// --- Social Post Factories ---

export function buildSocialPostContent(overrides?: Partial<SocialPostContent>): SocialPostContent {
  return {
    body: 'Transform your home with our expert painting services! Free estimates available.',
    hashtags: ['painting', 'homeimprovement'],
    ...overrides,
  }
}

export function buildSocialPostListItem(
  overrides?: Partial<SocialPostListItem>,
): SocialPostListItem {
  return {
    id: 'social-1',
    platform: 'gbp',
    postType: 'update',
    title: 'Spring Painting Special',
    body: 'Transform your home with our expert painting services! Free estimates available.',
    hashtags: [],
    status: 'review',
    mediaAssetId: null,
    createdAt: '2026-03-10T12:00:00Z',
    ...overrides,
  }
}

export function buildSocialPostDetail(overrides?: Partial<SocialPostDetail>): SocialPostDetail {
  return {
    id: 'social-1',
    platform: 'gbp',
    postType: 'update',
    title: 'Spring Painting Special',
    body: 'Transform your home with our expert painting services! Free estimates available.',
    hashtags: [],
    ctaType: 'LEARN_MORE',
    ctaUrl: 'https://cleanestpainting.com',
    mediaAssetId: null,
    mediaUrl: null,
    status: 'review',
    keywords: ['painting', 'spring special'],
    metadata: {},
    createdAt: '2026-03-10T12:00:00Z',
    updatedAt: '2026-03-10T12:00:00Z',
    publishedAt: null,
    ...overrides,
  }
}

// --- Review Factories ---

export function buildReviewListItem(overrides?: Partial<ReviewListItem>): ReviewListItem {
  return {
    id: 'review-1',
    platform: 'google',
    reviewerName: 'John Smith',
    rating: 5,
    reviewText:
      'Excellent painting work! The team was professional and the results exceeded our expectations.',
    reviewDate: '2026-03-01T12:00:00Z',
    responseStatus: 'pending',
    sentiment: null,
    createdAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

export function buildReviewDetail(overrides?: Partial<ReviewDetail>): ReviewDetail {
  return {
    id: 'review-1',
    platform: 'google',
    externalId: null,
    reviewerName: 'John Smith',
    reviewerProfileUrl: null,
    rating: 5,
    reviewText:
      'Excellent painting work! The team was professional and the results exceeded our expectations.',
    reviewDate: '2026-03-01T12:00:00Z',
    responseText: null,
    responseStatus: 'pending',
    responseGeneratedAt: null,
    responseApprovedBy: null,
    responseApprovedAt: null,
    responseSentAt: null,
    sentiment: null,
    sentimentScore: null,
    metadata: {},
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-01T12:00:00Z',
    ...overrides,
  }
}

export function buildReviewResponseContent(
  overrides?: Partial<ReviewResponseContent>,
): ReviewResponseContent {
  return {
    response_text:
      'Thank you so much for your kind words, John! We truly appreciate your feedback and are thrilled that our team exceeded your expectations. — The Cleanest Painting Team',
    sentiment: 'positive',
    sentiment_score: 0.95,
    key_themes: ['professionalism', 'quality results', 'exceeded expectations'],
    ...overrides,
  }
}

export function buildReviewOverview(overrides?: Partial<ReviewOverview>): ReviewOverview {
  return {
    totalReviews: 25,
    averageRating: 4.6,
    ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 17 },
    pendingResponses: 3,
    platformBreakdown: [
      { platform: 'google', count: 18, avgRating: 4.7 },
      { platform: 'yelp', count: 5, avgRating: 4.4 },
      { platform: 'angi', count: 2, avgRating: 4.5 },
    ],
    sentimentBreakdown: [
      { sentiment: 'positive', count: 20 },
      { sentiment: 'neutral', count: 3 },
      { sentiment: 'negative', count: 2 },
    ],
    recentReviews: [buildReviewListItem()],
    ...overrides,
  }
}

// --- Review Request Factories ---

export function buildReviewRequestListItem(
  overrides?: Partial<ReviewRequestListItem>,
): ReviewRequestListItem {
  return {
    id: 'rr-1',
    customerName: 'John Smith',
    customerPhone: '+12015551234',
    customerEmail: null,
    channel: 'sms',
    reviewUrl: 'https://g.page/r/cleanest-painting/review',
    status: 'pending',
    sentAt: null,
    createdAt: '2026-03-05T12:00:00Z',
    ...overrides,
  }
}

export function buildReviewRequestDetail(
  overrides?: Partial<ReviewRequestDetail>,
): ReviewRequestDetail {
  return {
    id: 'rr-1',
    customerName: 'John Smith',
    customerPhone: '+12015551234',
    customerEmail: null,
    channel: 'sms',
    reviewUrl: 'https://g.page/r/cleanest-painting/review',
    status: 'pending',
    sentAt: null,
    deliveredAt: null,
    completedAt: null,
    reviewId: null,
    errorMessage: null,
    metadata: {},
    createdBy: 'user-123',
    createdAt: '2026-03-05T12:00:00Z',
    updatedAt: '2026-03-05T12:00:00Z',
    ...overrides,
  }
}

export function buildReviewRequestOverview(
  overrides?: Partial<ReviewRequestOverview>,
): ReviewRequestOverview {
  return {
    total: 10,
    pending: 3,
    sent: 4,
    delivered: 1,
    completed: 1,
    failed: 1,
    ...overrides,
  }
}

// --- Video Factories ---

export function buildGenerateVideoResponse(
  overrides?: Partial<GenerateVideoResponse>,
): GenerateVideoResponse {
  return {
    id: 'video-1',
    videoType: 'cinematic_reel',
    filename: 'reel-freshly-painted-living-room.mp4',
    storagePath: 'org-456/videos/cinematic_reel/abc123.mp4',
    publicUrl:
      'https://example.supabase.co/storage/v1/object/public/media/org-456/videos/cinematic_reel/abc123.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 5242880,
    durationSeconds: 8,
    ...overrides,
  }
}

export function buildVideoLibraryItem(overrides?: Partial<VideoLibraryItem>): VideoLibraryItem {
  return {
    id: 'video-1',
    videoType: 'cinematic_reel',
    filename: 'reel-freshly-painted-living-room.mp4',
    publicUrl:
      'https://example.supabase.co/storage/v1/object/public/media/org-456/videos/cinematic_reel/abc123.mp4',
    mimeType: 'video/mp4',
    sizeBytes: 5242880,
    durationSeconds: 8,
    createdAt: '2026-03-07T12:00:00Z',
    ...overrides,
  }
}

export function buildVideoJobStatus(overrides?: Partial<VideoJobStatus>): VideoJobStatus {
  return {
    jobId: 'video-org-456-1709820000000',
    status: 'queued',
    progress: null,
    result: null,
    error: null,
    ...overrides,
  }
}

// --- Analytics Factories ---

export function buildKeywordRankingListItem(
  overrides?: Partial<KeywordRankingListItem>,
): KeywordRankingListItem {
  return {
    query: 'interior painting nj',
    avgPosition: 8.2,
    totalClicks: 85,
    totalImpressions: 2400,
    avgCtr: 0.035,
    positionChange: 1.3,
    ...overrides,
  }
}

export function buildKeywordTrendPoint(overrides?: Partial<KeywordTrendPoint>): KeywordTrendPoint {
  return {
    date: '2026-03-04',
    position: 8.2,
    clicks: 12,
    impressions: 340,
    ...overrides,
  }
}

export function buildKeywordSummary(overrides?: Partial<KeywordSummary>): KeywordSummary {
  return {
    totalTracked: 45,
    avgPosition: 15.3,
    topMovers: [
      { query: 'interior painting nj', change: 3.2 },
      { query: 'house painting summit', change: -1.5 },
    ],
    ...overrides,
  }
}

export function buildAnalyticsOverview(overrides?: Partial<AnalyticsOverview>): AnalyticsOverview {
  return {
    ga4Connected: true,
    gscConnected: true,
    ga4: {
      sessions: 3200,
      users: 2100,
      pageviews: 8500,
      bounceRate: 0.42,
      sessionsTrend: 15,
      usersTrend: 12,
      pageviewsTrend: 18,
      bounceRateTrend: -3,
    },
    gsc: {
      clicks: 1250,
      impressions: 45000,
      ctr: 0.028,
      position: 18.3,
      clicksTrend: 12,
      impressionsTrend: 8,
      ctrTrend: 4,
      positionTrend: -5,
    },
    keywords: buildKeywordSummary(),
    ...overrides,
  }
}
