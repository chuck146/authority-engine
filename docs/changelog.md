# Changelog — Authority Engine

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added

- **UI rebrand (Navy):** Complete color system overhaul from green (#1a472a) to navy (#1B2B5B) with 30+ CSS custom properties for full Shadcn/ui theming, light/dark mode support
- **Font rebrand:** Replaced Inter with DM Sans (weights 300–700) for improved typography hierarchy (app/layout.tsx)
- **Logo integration:** Auth page and sidebar now display logo image instead of dynamic colored box (app/(auth)/layout.tsx, components/dashboard/app-sidebar.tsx)
- **Video types:** Zod discriminated union for cinematic_reel, project_showcase, testimonial_scene, brand_story with Veo model selection and aspect ratio support (types/video.ts)
- **Veo 3.1 integration:** Polling with exponential backoff (5–60s, 5-min timeout), starting frame → Veo handoff, Fast + Standard model support (lib/ai/veo.ts)
- **Video generator pipeline:** Orchestrates prompt → starting frame (optional) → Veo → Supabase Storage → media_assets DB insert (lib/ai/video-generator.ts)
- **Video prompt templates:** 4 video-type-specific builders (cinematic reel, project showcase, testimonial scene, brand story) with Veo Visual+Audio format (packages/ai/prompts/videos/)
- **Video BullMQ worker:** video-generation queue with concurrency=1 (Veo rate limits), exponential backoff retry (lib/queue/video-worker.ts)
- **Video scheduler:** enqueueVideoJob() with 2 attempts + backoff, getVideoJobStatus() for polling (lib/queue/video-scheduler.ts)
- **Video APIs (6 routes):** POST generate (queues job, returns jobId), GET list with pagination, GET detail, GET status polling, DELETE, POST schedule for calendar (app/api/v1/video/)
- **Video dashboard UI:** Page with tabs (All Videos, Generate, Status), dynamic generate form, library grid, detail sheet, generation status poller with progress bar (components/video/)
- **Video sidebar nav:** "Video" module added to dashboard navigation (components/dashboard/app-sidebar.tsx)
- **Storage extended:** uploadVideo() function for Supabase Storage with org-scoped paths (lib/storage/supabase-storage.ts)
- **Progress component:** Radix UI progress bar used by video generation status display (components/ui/progress.tsx)

### Changed

- **Roadmap swap:** Moved Analytics from Later into V2 milestone; moved Community from V2 to Later milestone. Analytics has ~30% existing infrastructure (GA4 + GSC service libs, 14 UI components, 8 API endpoints, 5 DB tables, 4 background workers) making it a natural V2 fit.
- **GA4 property selector improved:** Properties route now filters out rollup/sub-properties and enriches each property with its websiteUrl via Data Streams API (app/api/v1/integrations/ga4/properties/route.ts)
- **GA4 service library:** Added listDataStreams() function to fetch web stream data including websiteUrl (lib/google/analytics.ts)
- **GA4 types:** Added Ga4WebStreamData and Ga4DataStream types (types/ga4.ts)
- **GA4 property selector UI:** Dropdown now displays website URL alongside property name for easier identification (components/settings/ga4-property-selector.tsx)
- **Test suite expanded:** 933+ tests across 126+ files (94+ new video tests, prompt builder tests)

---

## [V2.4] — 2026-03-06

### Added

- **Production deployment:** App deployed to Vercel at authority-engine-rose.vercel.app
- **Supabase Auth configured:** Site URL and redirect URLs set for production magic link login

### Changed

- **XSS sanitizer swap:** Replaced isomorphic-dompurify with sanitize-html in content-body.tsx (isomorphic-dompurify requires jsdom which fails on Vercel Edge/serverless)
- **Dependencies:** Added sanitize-html + @types/sanitize-html, removed isomorphic-dompurify dependency

---

## [V2.3] — 2026-03-05

### Added

- **Review request types:** Zod schemas for createReviewRequest, channel/status/platform literals, API response types — ReviewRequestListItem, ReviewRequestDetail, ReviewRequestOverview (types/review-requests.ts)
- **SMS adapter interface:** SmsAdapter with send() and getStatus() methods (lib/sms/adapter.ts)
- **SalesMessage client:** Two-step API flow (POST conversations → POST messages), E.164 phone normalization, factory function createSmsAdapter() (lib/sms/salesmessage.ts)
- **SMS message template:** buildReviewRequestMessage() with variable interpolation ({name}, {org}, {url}), default + custom message support (lib/sms/message-template.ts)
- **SMS BullMQ worker:** sms-send queue with concurrency 3, rate limiter 50 msgs/60s, fetches request + org, builds message, sends via adapter, updates status (lib/queue/sms-worker.ts)
- **SMS scheduler:** enqueueSmsJob() with exponential backoff retry (3 attempts, 5s delay), 5s Redis timeout (lib/queue/sms-scheduler.ts)
- **Review request list API:** GET /api/v1/reviews/requests — status/channel filters, pagination
- **Review request create API:** POST /api/v1/reviews/requests — Zod validation, editor+ role, stores custom message in metadata
- **Review request detail API:** GET /api/v1/reviews/requests/[id] — full request with timestamps and error info
- **Review request send API:** POST /api/v1/reviews/requests/[id]/send — triggers BullMQ SMS job, only pending/failed status
- **Review request overview API:** GET /api/v1/reviews/requests/overview — aggregated counts by status
- **SMS status API:** GET /api/v1/integrations/sms/status — env-var configuration check for SalesMessage
- **Review request form:** Customer name, phone, platform select, review URL, custom message with variable hints (components/reviews/review-request-form.tsx)
- **Review request list:** Fetches requests, status badges, channel labels, click-to-detail (components/reviews/review-request-list.tsx)
- **Review request detail sheet:** Full details, timestamps, Send SMS / Resend SMS actions (components/reviews/review-request-detail-sheet.tsx)
- **Reviews page updated:** "Request Reviews" tab added with form + list (components/reviews/reviews-page-client.tsx)
- **Settings UI updated:** SalesMessage (SMS) status row in integrations section, env-var based configuration check
- **Worker updated:** SMS worker registered in lib/worker.ts with event handlers and shutdown handling
- **.env.example updated:** Replaced Twilio placeholders with SALESMESSAGE_API_KEY, SALESMESSAGE_NUMBER_ID, SALESMESSAGE_TEAM_ID
- **Test suite expanded:** 817+ tests across 114+ files (81 new SMS/review-request tests across 12 files)

---

## [V2.2] — 2026-03-05

### Added

- **GBP types:** Zod schemas for GBP accounts, locations, reviews, reply operations, starRatingToNumber helper (types/gbp.ts)
- **GBP service library:** listAccounts, listLocations, listReviews, replyToReview, deleteReply — Google My Business API v4 wrapper (lib/google/business-profile.ts)
- **GBP background sync worker:** BullMQ worker syncs Google reviews into reviews table with dedup, sentiment/theme extraction, star rating conversion (lib/queue/gbp-sync-worker.ts)
- **GBP sync scheduler:** Daily cron + manual trigger for all connections with gbp_location_id (lib/queue/gbp-scheduler.ts)
- **GBP integration APIs (4 routes):** GET status, POST disconnect, GET locations, POST select-location (app/api/v1/integrations/gbp/)
- **Review sync API:** POST /api/v1/reviews/sync — manual trigger for GBP review sync
- **Post reply API:** POST /api/v1/reviews/[id]/post-reply — post approved response to Google, with update/delete support
- **GBP location selector:** Settings UI component for choosing GBP location after OAuth connect (components/settings/gbp-location-selector.tsx)
- **Settings UI updated:** Integrations section now shows GBP row alongside GSC and GA4 with connect/disconnect
- **OAuth extended:** Google OAuth route + callback handle business_profile provider with GBP-specific scopes
- **Token manager:** business_profile provider support for token refresh
- **Review detail sheet:** "Post to Google" action button for approved responses on Google reviews
- **Reviews page:** Sync button on Google tab for manual GBP review sync
- **Worker updated:** Registers GBP sync worker + scheduler alongside existing workers
- **Test suite expanded:** 736 tests across 102 files (50 new GBP tests across 10 files)

---

## [V2.1] — 2026-03-05

### Added

- **Review database migrations:** reviews table with RLS, 6 indexes, UNIQUE constraint for platform dedup (20260306000001_create_reviews.sql); review_requests table with RLS (20260306000002_create_review_requests.sql)
- **Review types:** Zod schemas (createReview, generateResponse, editResponse, statusUpdate), platform/status/sentiment literals, API response types — ReviewListItem, ReviewDetail, ReviewOverview, ReviewResponseContent (types/reviews.ts)
- **Response status transitions:** pending→draft→review→approved→sent→archived with role requirements (lib/reviews/response-status-transitions.ts)
- **AI review response generator:** Tone-aware prompt builder (appreciative/empathetic/professional/friendly) (packages/ai/prompts/reviews/response-generator.ts); Claude API wrapper returning response + sentiment + key_themes (lib/ai/review-response-generator.ts)
- **Review list API:** GET /api/v1/reviews — platform/rating/status filters, pagination
- **Review create API:** POST /api/v1/reviews — manual review entry with Zod validation
- **Review detail API:** GET /api/v1/reviews/[id] — full review with response
- **Review edit API:** PUT /api/v1/reviews/[id] — edit response text
- **Review AI generate API:** POST /api/v1/reviews/[id]/generate-response — AI response draft with tone/length/instructions
- **Review status API:** PATCH /api/v1/reviews/[id]/response-status — approve/reject/mark_sent/archive transitions
- **Review overview API:** GET /api/v1/reviews/overview — dashboard aggregations (avg rating, total, pending, distributions)
- **Reviews page client:** 7 tabs (All, Google, Yelp, Angi's, Manual, Overview, Add Review)
- **Review list component:** Star ratings, platform badges, status badges, click-to-detail
- **Review detail sheet:** Full review display, response draft, actions (generate/edit/approve/reject/mark_sent/archive/copy)
- **Review response form:** Tone selector, max length, custom instructions, generate button
- **Review overview cards:** Avg rating, total reviews, pending count, rating distribution bar chart, platform + sentiment breakdowns
- **Review entry form:** Manual review entry with star picker
- **Test suite expanded:** 686 tests across 92 files (94 new review tests across 10 files)

---

## [V1.3] — 2026-03-05

### Added

- **Calendar entry sheet:** Right-side panel for viewing and acting on calendar entries (reschedule, cancel publish, error display, published timestamp)
- **Calendar list view:** Chronological agenda view alternative to month grid, entries grouped by date
- **Calendar filters:** Content type and status filter dropdowns on calendar page
- **Approved-content API:** GET /api/v1/content/approved — returns 50 most recently updated approved items by content type, powers schedule dialog picker
- **Schedule dialog improved:** Select dropdown for approved content replaces raw ID text input
- **Calendar grid popover:** "+N more" overflow entries expandable via popover
- **Entry card enhancements:** Tooltip on status dot, border-left color coding by content type
- **Calendar constants:** Extracted shared label/color/type maps to calendar-constants.ts
- **Test coverage:** 15+ new tests for entry sheet (10), list view (5), grid enhancements (2)

---

## [V1.2] — 2026-03-05

### Added

- **Social post types:** Zod discriminated union for GBP/Instagram/Facebook inputs, platform-specific schemas, edit schema (types/social.ts)
- **Calendar content type extension:** CalendarContentType includes 'social_post' alongside original ContentType (types/calendar.ts)
- **Social prompt builders:** Platform-optimized Claude prompts for GBP (local business focus, CTA suggestions), Instagram (emoji, hashtag strategy), Facebook (community engagement, longer-form) (packages/ai/prompts/social/)
- **Social content generator:** Claude API integration with maxTokens=1024, temperature=0.8, JSON output parsing (lib/ai/social-generator.ts)
- **Social generate API:** POST /api/v1/social/generate — auth, Zod validation, Claude generation, optional Nano Banana 2 image, insert with status='review'
- **Social list API:** GET /api/v1/social — list posts with optional platform/status filters
- **Social detail API:** GET /api/v1/social/[id] — single post with media URL resolution; PUT for editing body/hashtags/CTA
- **Social status API:** PATCH /api/v1/social/[id]/status — reuses existing content status transitions (approve/reject/publish/archive)
- **Publish worker extended:** BullMQ worker handles 'social_post' content type for scheduled publishing via content calendar
- **Social dashboard UI:** /social page with 5 tabs (All Posts, GBP, Instagram, Facebook, Generate), platform-specific previews, generate form with dynamic fields per platform, post detail sheet with approval actions and clipboard copy
- **Social sidebar nav:** "Social & GBP" item added to dashboard sidebar (components/dashboard/app-sidebar.tsx)
- **Database migration:** social_posts table with RLS policies, platform/status indexes (20260310000002_create_social_posts.sql)
- **Test factories:** buildSocialPostContent, buildSocialPostListItem, buildSocialPostDetail (tests/factories.ts)
- **Test suite expanded:** 568 tests across 79 files (61 new social tests covering routes, generator, components)

---

## [V1.1] — 2026-03-05

### Added

- **GA4 Service Library:** listAccountSummaries, runReport (lib/google/analytics.ts) — Admin + Data API wrappers
- **GA4 Integration APIs:** GET /api/v1/integrations/ga4/status, POST disconnect, GET properties, POST select-property
- **GA4 Data API:** GET /api/v1/ga4/overview (28-day metrics: sessions, users, pageviews, bounce rate + top pages, traffic sources, device breakdown, daily trend)
- **GA4 Background Sync:** BullMQ worker syncs page metrics, traffic sources, device breakdown, daily totals into ga4_page_metrics + ga4_snapshots (lib/queue/ga4-sync-worker.ts, lib/queue/ga4-scheduler.ts)
- **GA4 Dashboard UI:** "Analytics" tab in SEO Dashboard with overview cards, traffic trend chart, top pages table, traffic sources breakdown, device breakdown (components/seo/ga4-\*.tsx)
- **GA4 Settings UI:** Property selector for choosing GA4 property after OAuth connect (components/settings/ga4-property-selector.tsx)
- **Settings UI updated:** Integrations section now shows both GSC and GA4 rows with independent connect/disconnect
- **Database migration:** ga4_page_metrics (per-page daily metrics with upsert), ga4_snapshots (JSONB traffic/device/daily snapshots), both with RLS
- **GA4 types:** Full type definitions for GA4 accounts, properties, reports, metrics, snapshots (types/ga4.ts)
- **OAuth extended:** Google OAuth state now includes 4-part format (integration type: gsc|ga4, org_id, user_id, HMAC)
- **Test suite expanded:** 507+ tests across 71 files (67 new GA4 tests), 6 pre-existing OAuth test failures fixed

### Fixed

- OAuth state format updated from 3-part to 4-part (added integration type) — fixes GSC state validation tests
- Integrations section tests updated to match refactored 2-row layout (GSC + GA4)

---

## [V1] — 2026-03-04

### Added

- **SEO Health Score:** Pure scoring engine with 10 rules across 4 categories (lib/seo/rules.ts, lib/seo/scorer.ts)
- **SEO Dashboard:** Overview cards, distribution chart, content list, detail panel with rule-by-rule breakdown
- **SEO APIs:** GET /api/v1/seo (overview with backfill), GET /api/v1/seo/[type]/[id] (detail)
- **Auto SEO scoring:** Content scored on generate and edit (PUT route recalculates on content/meta/keyword change)
- **Nano Banana 2 image generation:** Gemini 2.0 Flash client (lib/ai/gemini.ts), image generator pipeline (lib/ai/image-generator.ts)
- **Image prompt templates:** Blog thumbnail, location hero, social graphic (packages/ai/prompts/images/)
- **Media UI:** Image generation form, media library grid, detail sheet (components/media/)
- **Media APIs:** POST /api/v1/media/generate, GET /api/v1/media, GET /api/v1/media/[id]
- **Media storage:** Supabase Storage upload helper (lib/storage/supabase-storage.ts), storage bucket migration
- **Content calendar:** Scheduling with grid UI, calendar APIs (POST/GET/PUT/DELETE), BullMQ worker for scheduled publishing
- **Dashboard metrics:** Hero cards (total content, published, avg SEO score, media count), content pipeline chart, recent activity feed
- **Dashboard API:** GET /api/v1/dashboard (aggregated metrics from all content tables + media)
- **Redis timeout handling:** Graceful BullMQ connection timeouts, API robustness improvements
- **Google Search Console OAuth2:** Token encryption (AES-256-GCM), auto-refresh, HMAC-signed state parameter, admin-only connect/disconnect
- **GSC Service Library:** fetchSearchAnalytics, fetchSitemaps, inspectUrl, listSites (lib/google/search-console.ts)
- **GSC Integration APIs:** GET /api/v1/integrations/google/status, POST disconnect, GET properties
- **GSC Data APIs:** GET /api/v1/gsc/overview (28-day trends + top queries/pages + sitemaps + indexing), GET search-analytics (Zod-validated dimensions/pagination), GET sitemaps, POST url-inspection
- **GSC Background Sync:** BullMQ worker with daily cron (6 AM), keyword_rankings upsert in batches of 500, sitemap snapshot storage (lib/queue/gsc-sync-worker.ts, lib/queue/gsc-scheduler.ts)
- **Settings UI:** Integrations section with GSC connect/disconnect, status badge, site URL display (components/settings/integrations-section.tsx)
- **SEO Dashboard tabs:** "On-Page SEO" + "Search Console" with overview cards, top queries table, top pages table, indexing coverage (components/seo/gsc-\*.tsx)
- **Database migrations:** google_connections (encrypted tokens, RLS), keyword_rankings (composite unique, RLS), gsc_snapshots
- **Test suite expanded:** 440+ tests (up from 289), covering GSC routes, sync worker, scheduler, dashboard components

### Changed

- Upgraded Supabase types to auto-generated schema (replaced hand-written types/database.ts)
- Cleaned up type casts across codebase after schema upgrade

---

## [MVP] — 2026-03-03

### Added

- Project scaffold with PSB framework
- CLAUDE.md hierarchy (root + directory-specific)
- Documentation: project_spec.md, architecture.md, video-guidelines.md, project_status.md
- Sub-agents: changelog, frontend-testing, retro
- Slash commands: /update-docs-and-commit, /new-feature, /run-tests
- Git hooks: pre-push typecheck + lint
- Next.js 15 app with App Router (dashboard + marketing route groups)
- Supabase database schema: 11 migrations, 7+ tables with RLS policies
- Auth flow: Supabase Auth with email + magic link, middleware, server/API guards
- Dashboard shell: sidebar navigation, org branding, user nav, module stubs
- AI content generator: Claude API integration with prompt templates (service pages, location pages, blog posts)
- Content types system with Zod validation (StructuredContent JSON schema)
- Content review + approval workflow (status transitions: draft → review → approved → published → archived)
- Content editing endpoint (PUT /api/v1/content/[type]/[id]) with Zod validation, status guards, slug uniqueness
- Content detail sheet with preview and approval actions
- Public SSR pages: /services/[slug], /locations/[slug], /blog/[slug] with ISR
- Marketing layout components: service page, location page, blog post
- Seed data: 1 org, 8 services, 12 locations, 3 blog posts for Cleanest Painting
- Test infrastructure: Vitest + React Testing Library, factories, mock Supabase client (172+ tests)
- Generated TypeScript types from live Supabase schema (replaced hand-written types/database.ts)
- Auto-link auth user to organization on first login (auth callback creates user_organizations record)
- Auth callback test suite (9 tests covering auto-linking, redirect sanitization, edge cases)

### Fixed

- Auth flow: middleware callback bypass, redirect loop prevention, auto-link user to org (PR #2)
