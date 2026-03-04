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
  CalendarEntry,
  CalendarStatus,
  CalendarViewItem,
  ScheduleContentRequest,
  UpdateScheduleRequest,
  CalendarQueryParams,
} from './calendar'

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
