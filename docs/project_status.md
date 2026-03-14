# Authority Engine — Project Status

_Last Updated: March 15, 2026_

---

## Milestone Overview

| Milestone                               | Status         | Target         | Progress |
| --------------------------------------- | -------------- | -------------- | -------- |
| 🟢 MVP — Content Generator + Auth + DB  | ✅ Complete    | April 2026     | 100%     |
| 🔵 V1 — SEO Scoring + Images + Calendar | ✅ Complete    | June 2026      | 100%     |
| 🟡 V2 — Reviews + Video + Analytics     | ✅ Complete    | September 2026 | 100%     |
| 🟣 Later — White-Label + Community      | 🔲 Not Started | TBD            | 0%       |

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
- [x] Vercel project linked
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
- [x] Deploy to production (Vercel)
- [x] Supabase Auth URL configuration (Site URL + redirect URLs for production)

### What's Next

- MVP complete and deployed

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
- [x] GA4 Settings UI: property selector (with website URL display, rollup filtering), connect/disconnect for GA4 alongside GSC
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
- [x] Test suite expanded to 933 tests across 126 files
- [x] Calendar enhancements: entry detail sheet, list/agenda view, content type + status filters
- [x] Approved-content API (GET /api/v1/content/approved) for schedule dialog picker
- [x] Schedule dialog UX: select dropdown for approved content instead of raw ID input
- [x] Calendar grid: popover for overflow entries, entry card tooltips + color coding
- [x] Test suite expanded to 583+ tests across 82 files

### What's Next

- V1 complete and deployed

### Blockers

- None

---

## 🟡 V2 — Reviews + Video + Analytics

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

**Phase C: SalesMessage SMS Review Requests** ✅

- [x] Review request types: Zod schemas (createReviewRequest, channel, status, platform), API response types (types/review-requests.ts)
- [x] SMS adapter interface: SmsAdapter with send/getStatus (lib/sms/adapter.ts)
- [x] SalesMessage client: two-step API flow (conversations → messages), E.164 phone normalization, factory function (lib/sms/salesmessage.ts)
- [x] SMS message template: variable interpolation ({name}, {org}, {url}), default + custom message support (lib/sms/message-template.ts)
- [x] BullMQ SMS worker: sms-send queue, concurrency 3, rate limiter 50/60s, status updates (lib/queue/sms-worker.ts)
- [x] SMS scheduler: enqueueSmsJob with exponential backoff retry (3 attempts), 5s Redis timeout (lib/queue/sms-scheduler.ts)
- [x] Review request APIs (5 routes): list with filters, create, detail, send/resend trigger, overview aggregations (app/api/v1/reviews/requests/)
- [x] SMS status API: GET /api/v1/integrations/sms/status — env-var configuration check
- [x] Review request UI: form (customer name, phone, platform, URL, custom message), list with status badges, detail sheet with Send/Resend actions
- [x] Reviews page: "Request Reviews" tab added to reviews-page-client
- [x] Settings UI: SalesMessage status row in integrations section (env-var based, no OAuth)
- [x] Worker updated: SMS worker registered in lib/worker.ts with shutdown handling
- [x] Test suite: ~81 new tests across 12 files (817+ total, up from 736)

**Phase D: UI Rebrand (Navy) + Video Generation (Veo 3.1)** ✅

- [x] UI rebrand: Green (#1a472a) → Navy (#1B2B5B) color system with full light/dark theme support
- [x] Design token system: 30+ CSS custom properties for Shadcn/ui components (app/globals.css)
- [x] Font rebrand: Inter → DM Sans (weights 300–700) for improved typography hierarchy
- [x] Logo integration: auth page and sidebar display logo image instead of dynamic color box
- [x] Video types: Zod discriminated union for cinematic_reel, project_showcase, testimonial_scene, brand_story (types/video.ts)
- [x] Veo 3.1 integration: polling with exponential backoff, starting frame handoff, Fast + Standard models (lib/ai/veo.ts)
- [x] Video generator pipeline: prompt → starting frame (optional) → Veo → Supabase Storage → DB insert (lib/ai/video-generator.ts)
- [x] Video prompt templates: 4 video-type-specific prompt builders with Veo Visual+Audio format (packages/ai/prompts/videos/)
- [x] Video BullMQ worker + scheduler: video-generation queue, concurrency=1, exponential backoff retry (lib/queue/video-worker.ts, lib/queue/video-scheduler.ts)
- [x] Video APIs (6 routes): generate, list, detail, status polling, delete, schedule (app/api/v1/video/)
- [x] Video dashboard UI: page with tabs, generate form with dynamic fields, library grid, detail sheet, generation status poller (components/video/)
- [x] Video sidebar nav: "Video" module added to dashboard sidebar
- [x] Storage extended: uploadVideo() for Supabase Storage (lib/storage/supabase-storage.ts)
- [x] Progress component: Radix UI progress bar for video generation status (components/ui/progress.tsx)
- [x] Test suite: 933+ tests across 126+ files (94+ video tests, prompt builder tests)

**Phase E: Analytics Module** ✅

- [x] Analytics types: DateRangePreset, KeywordRankingListItem, KeywordTrendPoint, AnalyticsOverview with Zod schemas (types/analytics.ts)
- [x] Date range service: resolveDateRange() with presets (7d/28d/90d) + custom, comparison period calculation (lib/analytics/date-range.ts)
- [x] Keyword rankings service: getKeywordRankings() paginated/sortable/searchable, getKeywordTrend() daily (lib/analytics/keyword-rankings.ts)
- [x] Analytics overview API: GET /api/v1/analytics/overview — unified GA4 + GSC + keyword summary, parallel fetch, graceful fallback
- [x] Keywords API: GET /api/v1/analytics/keywords — paginated rankings with date range + sort + search
- [x] Keyword trend API: GET /api/v1/analytics/keywords/[query]/trend — daily position trend
- [x] Date range picker: URL-param-driven preset selector + native date inputs (components/analytics/date-range-picker.tsx)
- [x] Analytics page client: 3 tabs (Overview, Keywords, Search Performance), reuses GA4/GSC components (components/analytics/analytics-page-client.tsx)
- [x] Keyword rankings table: sortable with pagination, search, position change arrows, trend sheet (components/analytics/keyword-rankings-table.tsx)
- [x] Keyword trend detail: sheet with summary cards + position/clicks bar chart (components/analytics/keyword-trend-detail.tsx)
- [x] GA4 overview API extended with optional startDate/endDate query params (backward-compatible)
- [x] Analytics dashboard page: /analytics route with requireAuth() guard
- [x] Test suite: 41 new tests across 9 files (974 total, up from 933)

**Phase F: Remotion Integration (Tier 1 Programmatic Video)** ✅

- [x] Remotion project: isolated services/video/ with tsconfig, registerRoot, Root.tsx with 4 Composition definitions, Zod-validated props (services/video/src/)
- [x] Remotion compositions (4): TestimonialQuote (6s), TipVideo (10s), BeforeAfterReveal (8s), BrandedIntroOutro (3s) — all 1080×1920 @ 30fps
- [x] Shared components (5): BrandedBackground, Logo (<Img /> for SSR), TextReveal (word-by-word kinetic text), StarRating (animated), CtaOverlay
- [x] Animation library: fadeIn, fadeOut, slideUp, scaleIn, wipeReveal (services/video/src/lib/animations.ts)
- [x] Font system: 12 Google Fonts across 5 categories (Sans, Serif, Script, Display, Mono) via @remotion/google-fonts with lazy loading (services/video/src/lib/fonts.ts)
- [x] Remotion BullMQ worker: remotion-rendering queue with bundle caching, bundle() → selectComposition() → renderMedia() → Supabase upload → DB insert (lib/queue/remotion-worker.ts)
- [x] Remotion scheduler: enqueueRemotionJob() + getRemotionJobStatus() (lib/queue/remotion-scheduler.ts)
- [x] VideoEngine enum: veo | remotion with isRemotionVideoType() helper (types/video.ts)
- [x] 5 Remotion video types: testimonial_quote, tip_video, before_after_reveal, branded_intro, branded_outro with Zod input schemas (types/video.ts)
- [x] Engine routing: generate API routes to Remotion or Veo queue based on video type (app/api/v1/video/generate/route.ts)
- [x] Dual-queue status polling: checks both remotion-rendering and video-generation queues with prefix-based routing (app/api/v1/video/[id]/status/route.ts)
- [x] Video library engine filter: ?engine=remotion|veo query param, engine badge on cards (app/api/v1/video/route.ts, components/video/)
- [x] Engine selector UI: Remotion/Veo toggle with dynamic type-specific fields — tip builder, star picker, image URL inputs (components/video/video-generate-form.tsx)
- [x] Per-video font selection: heading/body font dropdowns grouped by category on generate form, optional headingFont/bodyFont on all Remotion + composite schemas (components/video/video-generate-form.tsx, types/video.ts)
- [x] Shared font catalog: lib/video/fonts.ts for frontend (no Remotion imports), composition font support in all 4 compositions + shared components
- [x] Worker registration: createRemotionWorker() registered in lib/worker.ts with shutdown handling
- [x] Dependencies: 6 Remotion packages + dev:remotion script added to package.json
- [x] Test suite: 974/974 passing (all existing tests updated for new engine field)

**Phase G: Pipeline B — Composite Video (Veo + Remotion)** ✅

- [x] Composite worker: BullMQ `composite-rendering` queue with concurrency=1, five-step orchestration (intro → veo → outro → stitch → upload), FFmpeg concat demuxer with h264/aac fallback, temp file cleanup (lib/queue/composite-worker.ts)
- [x] Composite scheduler: enqueueCompositeJob() with `composite-${orgId}-${timestamp}` job IDs, 2 retry attempts with exponential backoff, getCompositeJobStatus() with compositeStep detail (lib/queue/composite-scheduler.ts)
- [x] Composite video type: `composite_reel` added to Zod discriminated union with generateCompositeRequestSchema (types/video.ts)
- [x] VideoEngine extended: `'veo' | 'remotion' | 'composite'` with isCompositeVideoType(), isVeoVideoType() helpers (types/video.ts)
- [x] CompositeJobStep + CompositeJobProgress types for sub-step tracking (types/video.ts)
- [x] Generate API: three-way engine routing — composite_reel → composite queue, Remotion types → remotion queue, Veo types → video queue (app/api/v1/video/generate/route.ts)
- [x] Status API: tri-queue polling with prefix-based routing (composite-\* prefix), compositeStep in response (app/api/v1/video/[id]/status/route.ts)
- [x] Engine selector UI: three-way toggle (Remotion / Veo / Composite) with composite-specific fields — scene description, audio mood, CTA, includeIntro/includeOutro/useStartingFrame checkboxes (components/video/video-generate-form.tsx)
- [x] Composite status UI: five-step progress indicator with active step highlighting, step labels, 5–10 min estimate (components/video/video-generation-status.tsx)
- [x] Worker registration: createCompositeWorker() registered in lib/worker.ts (8 workers total)
- [x] Test suite: 74 new tests across 5 files (1029+ total, up from 974)

**Phase H: Pipeline C — Full Premium Video (Claude + Nano Banana + Veo Standard + Remotion)** ✅

- [x] Premium script generator: Claude API → JSON → Zod validation, returns title + scenes array with sceneNumber/description/audio/imagePrompt (lib/ai/premium-script-generator.ts)
- [x] Premium prompt template: video script prompt builder with org context, topic, style, scene count (packages/ai/prompts/videos/premium-script.ts)
- [x] Premium worker: BullMQ `premium-rendering` queue with concurrency=1, seven-step orchestration (script → keyframes → scenes → intro → outro → stitch → upload), scene-level sub-progress, temp file cleanup (lib/queue/premium-worker.ts)
- [x] Premium scheduler: enqueuePremiumJob() with `premium-${orgId}-${timestamp}` job IDs, 2 retry attempts with exponential backoff, getPremiumJobStatus() with premiumStep detail (lib/queue/premium-scheduler.ts)
- [x] Premium video type: `premium_reel` added to Zod discriminated union with generatePremiumRequestSchema (types/video.ts)
- [x] VideoEngine extended: `'veo' | 'remotion' | 'composite' | 'premium'` with isPremiumVideoType() helper (types/video.ts)
- [x] PremiumJobStep + PremiumJobProgress types for sub-step tracking with scene progress (types/video.ts)
- [x] Generate API: four-way engine routing — premium_reel → premium queue, composite_reel → composite queue, Remotion types → remotion queue, Veo types → video queue (app/api/v1/video/generate/route.ts)
- [x] Status API: quad-queue polling with prefix-based routing (premium-\* → premium queue), premiumStep in response (app/api/v1/video/[id]/status/route.ts)
- [x] Engine selector UI: four-way toggle (Remotion / Veo / Composite / Premium) with premium-specific fields — topic, style, scene count, Veo model selector (components/video/video-generate-form.tsx)
- [x] Premium status UI: seven-step progress indicator with scene sub-progress, step labels, 10–20 min estimate (components/video/video-generation-status.tsx)
- [x] Shared parseClaudeJsonResponse extraction: DRY refactor from 3 generators into lib/ai/claude.ts
- [x] Shared video-utils.ts extraction: DRY refactor from composite-worker — downloadFromStorage, stitchClips, buildBrandProps (lib/queue/video-utils.ts)
- [x] Worker registration: createPremiumWorker() registered in lib/worker.ts (9 workers total)
- [x] Test suite: 52 new tests across 6 files (1081+ total, up from 1029)

**Phase I: Content Performance Analytics** ✅

- [x] Content performance service: slug→page_path GA4 correlation, joins content tables with ga4_page_metrics for unified performance view (lib/analytics/content-performance.ts)
- [x] Content performance API: GET /api/v1/analytics/content-performance — paginated, sortable, filterable by content type, date range support (app/api/v1/analytics/content-performance/)
- [x] Content performance table: sortable columns (title, type, SEO score, sessions, pageviews, bounce rate, engagement), content type badges, SEO score color badges, pagination (components/analytics/content-performance-table.tsx)
- [x] Analytics page: 4th "Content Performance" tab added to analytics-page-client.tsx
- [x] Types: ContentPerformanceItem, ContentPerformanceResponse, Zod query schema (types/analytics.ts)
- [x] Test suite: 16 new tests across 2 files — 8 API route tests + 8 component tests (1151 total, up from 1081)

**Post-V2: Serverless Infrastructure** ✅

- [x] Vercel cron jobs for GSC/GA4 sync (replaces BullMQ scheduler on serverless)
- [x] Manual sync API endpoints (admin-only POST /api/v1/integrations/gsc/sync, /ga4/sync)
- [x] Sync Now buttons in Settings and Analytics UI
- [x] Extracted standalone sync functions from BullMQ workers (no Redis dependency)
- [x] Analytics "not connected" fix: decoupled connection status from token validation
- [x] Empty siteUrl validation fix in GSC sync + actionable error messages
- [x] Test suite: 40 new cron + manual sync tests (1191+ total)

**Post-V2: Custom Domain Migration** ✅

- [x] Custom domain `cleanestpaintingnj.com` configured in Vercel (apex, Production)
- [x] DNS updated in SiteGround: A records for apex + www → Vercel IP (`216.150.1.1`), mail/FTP preserved
- [x] Supabase Auth: `https://cleanestpaintingnj.com` added to redirect URLs
- [x] Google Cloud OAuth consent screen pushed to Production mode (tokens won't expire)
- [x] GSC disconnected/reconnected under new domain (`cleanestpaintingnj.com` as site_url)
- [x] GA4 reconnected and property re-selected
- [x] Manual sync verified working for both GSC and GA4

**Post-V2: Marketing Visual Overhaul** ✅

- [x] Database migration: `hero_image_url TEXT` column on service_pages and location_pages
- [x] Service hero image type: `service_hero` added to Nano Banana 2 pipeline with prompt template
- [x] Hero image generation script: `scripts/generate-hero-images.ts` (batch CLI with --type, --slug, --dry-run, --force)
- [x] Marketing layout components: HeroSection (full-width image/gradient fallback), BrandedCta (navy + gold CTA bar)
- [x] Service/location/blog page layouts upgraded: HeroSection + BrandedCta, phone/estimateUrl props, og:image support
- [x] Content body enhanced: larger h2, brand-colored links, amber list markers, section dividers
- [x] Homepage redesigned: 7 modular section components (HeroSplit, TrustBar, AboutSection, ServicesDark, CtaBanner, Testimonials, ServiceAreas)
- [x] Shared marketing components: SiteHeader (sticky nav + mobile menu), SiteFooter (multi-column with service/location links), ScrollReveal (intersection observer animations)
- [x] Marketing layout refactored: fetches org data, renders shared header/footer for all public pages
- [x] CSS utilities: brand color custom properties, font-display class, gradient/animation utilities
- [x] Seed data updated: navy branding (#1B2B5B), DM Sans fonts, contact_info, estimate_url
- [x] OrgSettings type extended with estimate_url field
- [x] Typecheck + lint pass clean (0 errors, 0 warnings)
- [x] Migration applied to live Supabase
- [x] Types regenerated from live schema (hero_image_url on service_pages + location_pages)
- [x] Hero images generated for all 20 published pages (8 service + 12 location)
- [x] SEO Growth Sprint team agent added (.claude/agents/team-seo-growth.md)
- [x] Wrap-up slash command added (.claude/commands/wrap-up.md)
- [x] SEO Growth Sprint CLI scripts: 6 phases (baseline, content gaps, SEO optimize, social posts, technical audit, sprint summary) in scripts/seo-sprint/

**Post-V2: Technical SEO Fixes (Phase 4 Audit)** ✅

- [x] Missing og:url: added explicit `url` to OpenGraph metadata on service, location, and blog page routes
- [x] Missing Twitter Card meta tags: added `twitter:card`, `twitter:title`, `twitter:description` to all 5 marketing routes
- [x] Dynamic OG image: created `opengraph-image.tsx` for homepage (1200×630 branded image via Next.js ImageResponse)
- [x] Sitemap gap: added `/locations` hub page to sitemap.xml

**Post-V2: SEO Growth Sprint — March 2026 (First Sprint)** ✅

- [x] Phase 0 — Baseline: 24 pages (21 published, 2 review, 1 draft), 37 keywords tracked, 8 striking-distance, 18 GA4 sessions
- [x] Phase 1 — Content Gaps: Published 1 blog from review (SEO 82), generated 5 spring-themed blog posts + 5 expansion location pages (all in review)
- [x] Phase 2 — SEO Optimize: 17 pages optimized, average improvement +25 points (many 70s → 98-100)
- [x] Phase 3 — Social Posts: 12 posts created (6 GBP, 3 Instagram, 3 Facebook), all in review status
- [x] Hero images generated for 6 new location pages (5 expansion + Woodbridge) via Nano Banana 2
- [x] Phase 4 — Technical Audit: 33 issues found (1 high: missing og:image on blog, 31 medium: long titles + missing alt text, 1 low)
- [x] Phase 5 — Sprint Summary: 4/6 targets met, avg SEO score 96, 10 new pages created, 23 pages optimized
- [x] Script fixes: Phase 3 `created_by` field added for social_posts, `title` column removed from content_calendar references

Sprint Results:
| Metric | Before | After |
|--------|--------|-------|
| Total content pages | 24 | 34 |
| Pages in review | 2 | 11 |
| Published pages | 21 | 22 |
| Avg SEO score | 85 | 96 |
| Social posts | 0 | 12 |
| Location coverage | 12 cities | 17 cities (+5) |
| Blog posts | 3 | 8 (+5) |

### What's Next

- Approve 11 review-status pages in dashboard → publish
- Approve 12 social posts → begin scheduled distribution
- Fix 1 HIGH issue: missing og:image on blog/signs-exterior-needs-repainting
- Fix medium issues: trim 10 meta titles to ≤60 chars, add alt text to 21 images
- Next sprint recommended: April 13, 2026
- Proceed to Later milestone (White-Label + Community)

### Blockers

- None

---

## 🟣 Later — White-Label + Community

_Not started — waiting on V2 completion_

**Planned scope:** White-label admin, Stripe billing, Facebook group monitoring (Brand24 + Graph API), lead intent classifier, Slack lead alerts, A/B testing, email marketing (Resend), competitor tracking, custom report builder.

---

## Infrastructure (Not In Scope — Build As Needed)

- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Error monitoring (Sentry)
- [ ] Structured logging
- [ ] Database backups
- [ ] Rate limiting
- [ ] Security audit
