// E2E test constants — matches seed data from packages/db/supabase/seed.sql

export const TEST_USER_EMAIL = 'e2e-test@rodascgroup.com'
export const TEST_ORG_ID = '00000000-0000-0000-0000-000000000001' // Cleanest Painting LLC

// Unique suffix to avoid slug collisions across runs
const suffix = Date.now().toString(36)

export const SERVICE_PAGE_INPUT = {
  contentType: 'service_page' as const,
  serviceName: `E2E Deck Staining ${suffix}`,
  serviceDescription:
    'Professional deck staining services for residential homes in Northern New Jersey.',
  targetKeywords: ['deck staining', 'deck refinishing'],
  tone: 'professional' as const,
}

export const BLOG_POST_INPUT = {
  contentType: 'blog_post' as const,
  topic: `How to Choose the Right Paint Finish for Your Home ${suffix}`,
  targetKeywords: ['paint finish', 'interior painting tips'],
  category: 'painting-tips',
  tone: 'friendly' as const,
  targetWordCount: 600,
}

export const EDIT_PAYLOAD = {
  metaTitle: `E2E Edited Title ${suffix}`,
}
