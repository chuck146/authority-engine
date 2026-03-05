# Authority Engine — Project Status

_Last Updated: March 2026_

---

## Milestone Overview

| Milestone                               | Status         | Target         | Progress |
| --------------------------------------- | -------------- | -------------- | -------- |
| 🟢 MVP — Content Generator + Auth + DB  | ✅ Complete    | April 2026     | 95%      |
| 🔵 V1 — SEO Scoring + Images + Calendar | ✅ Complete    | June 2026      | 100%     |
| 🟡 V2 — Reviews + Video + Community     | 🔄 In Progress | September 2026 | 35%      |
| 🟣 Later — White-Label + Analytics      | 🔲 Not Started | TBD            | 0%       |

---

## 🟢 MVP — AI Content Generator + Auth + Database

### What's Been Accomplished

- [x] Product Requirements Document (PRD v1)
- [x] Technical architecture design
- [x] Video generation tech stack guidelines
- [x] CLAUDE.md project scaffold with PSB framework
- [x] Tech stack decision: Next.js + Supabase + Supabase Auth
- [x] Project repo initialized on GitHub
- [x] Supabase project created
- [ ] Vercel project linked
- [x] Database schema + migrations (11 migrations, 7+ tables with RLS policies)
- [x] Auth flow (email + magic link, middleware, server/API guards)
- [x] Dashboard shell (layout, sidebar, org branding, user nav, module stubs)
- [x] AI content generation (Claude API integration, prompt templates for 3 content types)
- [x] Content review + approval workflow (status transitions, role-based approve/reject/publish)
- [x] Content editing endpoint (PUT — edit title, slug, content, meta fields)
- [x] Public SSR pages for published content (/services, /locations, /blog)
- [x] Seed data (8 services, 12 locations, 3 blog posts for Cleanest Painting)
- [x] Test suite (172+ tests, Vitest + React Testing Library)
- [x] Apply migrations + seed to live Supabase
- [x] Generated TypeScript types from live schema (replaced hand-written types/database.ts)
- [x] Auto-link auth user to organization on first login
- [ ] Deploy to production (Vercel)

### What's Next

1. Connect Vercel project and deploy to production

### Blockers

- None

---

## 🔵 V1 — SEO Scoring + Images + Calendar

### What's Been Accomplished

- [x] SEO Health Score: pure scoring engine (10 rules, 4 categories, weights sum to 100)
- [x] SEO Dashboard: overview cards, distribution chart, content list, rule-by-rule detail panel
- [x] SEO APIs: GET /api/v1/seo (overview with backfill), GET /api/v1/seo/[type]/[id] (detail)
- [x] Auto SEO scoring on content generate and edit
- [x] Nano Banana 2 image generation: Gemini client, image generator pipeline
- [x] Image prompt templates: blog thumbnail, location hero, social graphic
- [x] Media UI: image generation form, media library grid, detail sheet
- [x] Media APIs: POST /api/v1/media/generate, GET /api/v1/media, GET /api/v1/media/[id]
- [x] Media storage: Supabase Storage upload, storage bucket migration
- [x] Content calendar: scheduling, grid UI, CRUD APIs, BullMQ worker for scheduled publishing
- [x] Dashboard metrics: hero cards, content pipeline chart, recent activity feed, dashboard API
- [x] Redis timeout handling and API robustness improvements
- [x] Google Search Console OAuth2 (AES-256-GCM token encryption, auto-refresh, HMAC-signed state)
- [x] GSC Service Library (fetchSearchAnalytics, fetchSitemaps, inspectUrl, listSites)
- [x] GSC Integration APIs (status, disconnect, properties endpoints)
- [x] GSC Data APIs (overview with 28-day trends, search-analytics, sitemaps, url-inspection)
- [x] GSC Background Sync (BullMQ daily cron, keyword_rankings upsert, sitemap snapshots)
- [x] Settings UI: Integrations section with GSC connect/disconnect
- [x] SEO Dashboard tabs: "On-Page SEO" + "Search Console" with overview cards, top queries, top pages, indexing coverage
- [x] Database migrations: google_connections, keyword_rankings, gsc_snapshots (all with RLS)
- [x] Test suite expanded to 440+ tests
- [x] Google Analytics 4 integration: service library, OAuth flow, integration APIs, data API, background sync, dashboard UI, property selector
- [x] GA4 database migration: ga4_page_metrics + ga4_snapshots (with RLS)
- [x] GA4 Settings UI: property selector, connect/disconnect for GA4 alongside GSC
- [x] GA4 Dashboard: "Analytics" tab with overview cards, traffic trend, top pages, traffic sources, device breakdown
- [x] OAuth state format extended to 4-part (integration type + org_id + user_id + HMAC)
- [x] Test suite expanded to 507+ tests across 71 files
- [x] Social post types: Zod discriminated union for GBP/Instagram/Facebook, CalendarContentType extension
- [x] Social prompt builders: platform-optimized Claude prompts (GBP, Instagram, Facebook)
- [x] Social content generator: Claude API with JSON output parsing (lib/ai/social-generator.ts)
- [x] Social APIs: generate, list, detail/edit, status transitions (app/api/v1/social/)
- [x] Publish worker extended for social_post content type
- [x] Social dashboard UI: /social page with platform tabs, generate form, post previews, approval actions
- [x] Database migration: social_posts table with RLS policies
- [x] Test suite expanded to 568 tests across 79 files
- [x] Calendar enhancements: entry detail sheet, list/agenda view, content type + status filters
- [x] Approved-content API (GET /api/v1/content/approved) for schedule dialog picker
- [x] Schedule dialog UX: select dropdown for approved content instead of raw ID input
- [x] Calendar grid: popover for overflow entries, entry card tooltips + color coding
- [x] Test suite expanded to 583+ tests across 82 files

### What's Next

1. Deploy to production (Vercel)

### Blockers

- None

---

## 🟡 V2 — Reviews + Video + Community

### What's Been Accomplished

**Phase A: Review Command Center — Core** ✅

- [x] Database migrations: reviews table (RLS, 6 indexes, UNIQUE dedup constraint), review_requests table (RLS)
- [x] TypeScript types: Zod schemas (createReview, generateResponse, editResponse, statusUpdate), platform/status/sentiment literals, API response types (types/reviews.ts)
- [x] Response status transitions: pending→draft→review→approved→sent→archived with role requirements
- [x] AI review response generator: tone-aware prompt builder (appreciative/empathetic/professional/friendly), Claude API wrapper returning response + sentiment + key_themes
- [x] Review APIs (7 endpoints): list with filters, manual entry, detail, edit response, AI generate response, response status transitions, overview aggregations
- [x] Review UI: page client with 7 tabs, review list with star ratings/platform badges/status badges, detail sheet with response draft + actions, response form with tone selector, overview cards with rating distribution + platform/sentiment breakdowns, manual entry form with star picker
- [x] Test suite: 94 new tests across 10 files (686 total, up from 583)

**Phase B: Google Business Profile Review Sync** ✅

- [x] GBP types: Zod schemas for accounts, locations, reviews, replies, starRatingToNumber helper (types/gbp.ts)
- [x] GBP service library: listAccounts, listLocations, listReviews, replyToReview, deleteReply (lib/google/business-profile.ts)
- [x] GBP background sync worker: BullMQ worker with dedup, sentiment extraction, star rating conversion (lib/queue/gbp-sync-worker.ts)
- [x] GBP sync scheduler: daily cron + manual trigger for connections with gbp_location_id (lib/queue/gbp-scheduler.ts)
- [x] GBP integration APIs (4 routes): status, disconnect, locations, select-location (app/api/v1/integrations/gbp/)
- [x] Review sync API: POST /api/v1/reviews/sync — manual GBP review sync trigger
- [x] Post reply API: POST /api/v1/reviews/[id]/post-reply — post approved response to Google
- [x] GBP location selector UI: settings component for choosing GBP location after OAuth (components/settings/gbp-location-selector.tsx)
- [x] OAuth + token manager extended for business_profile provider with GBP scopes
- [x] Review UI: "Post to Google" action on detail sheet, sync button on Google tab
- [x] Settings UI: GBP integration row alongside GSC and GA4
- [x] Test suite: 50 new tests across 10 files (736 total, up from 686)

### What's Next

1. Phase C: SalesMessage SMS review requests
2. Video generation (Remotion + Veo 3.1)
3. Community module (Facebook group monitoring + lead capture)

### Blockers

- None

---

## 🟣 Later — White-Label + Advanced Analytics

_Not started — waiting on V2 completion_

---

## Infrastructure (Not In Scope — Build As Needed)

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error monitoring (Sentry)
- [ ] Structured logging
- [ ] Database backups
- [ ] Rate limiting
- [ ] Security audit
