import type { CalendarContentType, CalendarStatus } from '@/types/calendar'

export const statusColors: Record<CalendarStatus, string> = {
  scheduled: 'bg-blue-500',
  publishing: 'bg-yellow-500',
  published: 'bg-green-500',
  failed: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

export const statusLabels: Record<CalendarStatus, string> = {
  scheduled: 'Scheduled',
  publishing: 'Publishing',
  published: 'Published',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

export const contentTypeLabels: Record<CalendarContentType, string> = {
  service_page: 'Service',
  location_page: 'Location',
  blog_post: 'Blog',
  social_post: 'Social',
}

export const contentTypeFullLabels: Record<CalendarContentType, string> = {
  service_page: 'Service Page',
  location_page: 'Location Page',
  blog_post: 'Blog Post',
  social_post: 'Social Post',
}

export const contentTypeBorderColors: Record<CalendarContentType, string> = {
  service_page: 'border-l-blue-500',
  location_page: 'border-l-emerald-500',
  blog_post: 'border-l-purple-500',
  social_post: 'border-l-orange-500',
}

export const ALL_CALENDAR_STATUSES: CalendarStatus[] = [
  'scheduled',
  'publishing',
  'published',
  'failed',
  'cancelled',
]

export const ALL_CONTENT_TYPES: CalendarContentType[] = [
  'service_page',
  'location_page',
  'blog_post',
  'social_post',
]
