export type { Database, Json } from './database'
export type {
  ContentType,
  StructuredContent,
  ContentSection,
  GenerateContentRequest,
  GenerateContentResponse,
  ContentListItem,
  ContentStatusUpdate,
  ContentEditRequest,
  ContentDetail,
} from './content'
export type {
  CalendarContentType,
  CalendarEntry,
  CalendarStatus,
  CalendarViewItem,
  ScheduleContentRequest,
  UpdateScheduleRequest,
  CalendarQueryParams,
} from './calendar'
export type {
  SeoRuleId,
  SeoRuleCategory,
  SeoRuleResult,
  SeoScoreResult,
  SeoScorerInput,
  SeoOverview,
  SeoContentItem,
  SeoScoreDistribution,
  SeoContentTypeSummary,
} from './seo'
export type {
  HeroMetrics,
  StatusBreakdown,
  ContentTypeBreakdown,
  ContentPipeline,
  RecentActivityItem,
  DashboardMetrics,
} from './dashboard'
export type {
  ImageType,
  GenerateImageRequest,
  GenerateImageResponse,
  MediaLibraryItem,
} from './media'
export type {
  GscConnectionStatus,
  GscProvider,
  GscConnection,
  SearchAnalyticsRow,
  SearchAnalyticsDimension,
  SearchAnalyticsQuery,
  GscSitemap,
  GscSitemapContent,
  UrlInspectionRequest,
  UrlInspectionResult,
  RichResultItem,
  GscOverview,
  GscSummary,
  KeywordRankingItem,
  PagePerformanceItem,
  IndexingCoverage,
  CrawlError,
  KeywordTrendPoint,
} from './gsc'
export type {
  SocialPlatform,
  GbpPostType,
  GbpCtaType,
  SocialPostContent,
  GbpPostInput,
  InstagramPostInput,
  FacebookPostInput,
  GenerateSocialPostRequest,
  SocialPostResponse,
  SocialPostListItem,
  SocialPostDetail,
  SocialPostEdit,
} from './social'
export type {
  Ga4AccountSummary,
  Ga4PropertySummary,
  Ga4ReportRequest,
  Ga4ReportRow,
  Ga4ReportResponse,
  Ga4Overview,
  Ga4Summary,
  Ga4TrafficTrendPoint,
  Ga4PageMetric,
  Ga4TrafficSource,
  Ga4DeviceBreakdown,
} from './ga4'
export type {
  ReviewPlatform,
  ReviewResponseStatus,
  ReviewSentiment,
  CreateReviewRequest,
  GenerateResponseRequest,
  ReviewResponseEdit,
  ReviewResponseStatusUpdate,
  ReviewResponseContent,
  ReviewListItem,
  ReviewDetail,
  ReviewOverview,
} from './reviews'
export type {
  ReviewRequestChannel,
  ReviewRequestStatus,
  ReviewRequestPlatform,
  CreateReviewRequestInput,
  ReviewRequestListItem,
  ReviewRequestDetail,
  ReviewRequestOverview,
} from './review-requests'
export type {
  VideoType,
  VeoModel,
  AspectRatio,
  GenerateVideoRequest,
  GenerateVideoResponse,
  VideoLibraryItem,
  VideoJobStatus,
} from './video'

// Convenience type aliases
export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived'
export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer'
export type MediaType = 'image' | 'video' | 'document'
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise'

// Row types (SELECT results)
export type Organization = import('./database').Database['public']['Tables']['organizations']['Row']
export type UserOrganization =
  import('./database').Database['public']['Tables']['user_organizations']['Row']
export type ServicePage = import('./database').Database['public']['Tables']['service_pages']['Row']
export type LocationPage =
  import('./database').Database['public']['Tables']['location_pages']['Row']
export type BlogPost = import('./database').Database['public']['Tables']['blog_posts']['Row']
export type MediaAsset = import('./database').Database['public']['Tables']['media_assets']['Row']
export type JobExecution =
  import('./database').Database['public']['Tables']['job_executions']['Row']
export type ContentCalendar =
  import('./database').Database['public']['Tables']['content_calendar']['Row']

// Insert types
export type OrganizationInsert =
  import('./database').Database['public']['Tables']['organizations']['Insert']
export type ServicePageInsert =
  import('./database').Database['public']['Tables']['service_pages']['Insert']
export type LocationPageInsert =
  import('./database').Database['public']['Tables']['location_pages']['Insert']
export type BlogPostInsert =
  import('./database').Database['public']['Tables']['blog_posts']['Insert']
export type ContentCalendarInsert =
  import('./database').Database['public']['Tables']['content_calendar']['Insert']

// Update types
export type ServicePageUpdate =
  import('./database').Database['public']['Tables']['service_pages']['Update']
export type LocationPageUpdate =
  import('./database').Database['public']['Tables']['location_pages']['Update']
export type BlogPostUpdate =
  import('./database').Database['public']['Tables']['blog_posts']['Update']
export type ContentCalendarUpdate =
  import('./database').Database['public']['Tables']['content_calendar']['Update']

// Auth context (used by middleware and auth guards)
export type AuthContext = {
  userId: string
  organizationId: string
  role: UserRole
}

// Branding configuration (stored in organizations.branding JSONB)
export type OrgBranding = {
  primary: string
  secondary: string
  accent: string
  tagline?: string
  fonts?: {
    heading: string
    body: string
  }
}

// Contact info (stored in organizations.settings.contact_info JSONB)
export type OrgContactInfo = {
  phone?: string
  email?: string
  address?: {
    streetAddress: string
    city: string
    state: string
    postalCode: string
    country?: string
  }
}

// Organization settings (stored in organizations.settings JSONB)
export type OrgSettings = {
  service_area_states?: string[]
  service_area_counties?: string[]
  contact_info?: OrgContactInfo
  hubspot_portal_id?: string
  clickup_list_id?: string
}

// Related content link types (for cross-linking)
export type RelatedServiceLink = { slug: string; title: string }
export type RelatedLocationLink = { slug: string; title: string; city: string; state: string }
export type RelatedBlogLink = { slug: string; title: string; excerpt: string | null }
