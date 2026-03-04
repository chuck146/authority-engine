# Changelog — Authority Engine

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Planned

- Deploy MVP to Vercel
- Google Analytics 4 integration
- GBP post generation and publishing
- Social media post generation (Instagram, Facebook)

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
- **SEO Dashboard tabs:** "On-Page SEO" + "Search Console" with overview cards, top queries table, top pages table, indexing coverage (components/seo/gsc-*.tsx)
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
