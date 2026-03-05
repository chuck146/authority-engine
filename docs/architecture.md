# Authority Engine — System Architecture

This document describes the high-level system architecture, data flow, and component relationships.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          VERCEL                                  │
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │   (marketing)        │    │   (dashboard)                 │   │
│  │   PUBLIC SSR PAGES   │    │   AUTHENTICATED APP           │   │
│  │                      │    │                               │   │
│  │  /services/[slug]    │    │  /dashboard                   │   │
│  │  /locations/[slug]   │    │  /content                     │   │
│  │  /blog/[slug]        │    │  /seo                         │   │
│  │                      │    │  /reviews                     │   │
│  │  Server Components   │    │  /community                   │   │
│  │  SSR for SEO         │    │  /analytics                   │   │
│  └──────────┬───────────┘    └──────────────┬────────────────┘   │
│             │                               │                    │
│  ┌──────────┴───────────────────────────────┴────────────────┐   │
│  │                    /app/api/                               │   │
│  │                 NEXT.JS API ROUTES                         │   │
│  │                                                            │   │
│  │  Auth Middleware → Org Scope → Controller → Service         │   │
│  └────────┬──────────┬──────────┬──────────┬─────────────────┘   │
│           │          │          │          │                      │
└───────────┼──────────┼──────────┼──────────┼─────────────────────┘
            │          │          │          │
    ┌───────▼──┐  ┌────▼───┐  ┌──▼───┐  ┌──▼──────────┐
    │ Supabase │  │ Claude │  │ Nano │  │ BullMQ      │
    │ Postgres │  │  API   │  │Banana│  │ + Redis     │
    │ + Auth   │  │        │  │  2   │  │             │
    │ + Storage│  │  Text  │  │Image │  │ Background  │
    │          │  │  Gen   │  │ Gen  │  │ Jobs        │
    │  RLS     │  │        │  │      │  │             │
    └──────────┘  └────────┘  └──────┘  └──────┬──────┘
                                               │
                                    ┌──────────┼──────────┐
                                    │          │          │
                               ┌────▼──┐  ┌───▼───┐  ┌──▼──────┐
                               │Remotion│  │  SEO  │  │External │
                               │ Video  │  │Audits │  │  APIs   │
                               │Render  │  │(Python│  │HubSpot  │
                               │        │  │FastAPI│  │Google   │
                               └────────┘  └───────┘  │Slack    │
                                                       └─────────┘
```

---

## Route Groups

| Group         | Path                                                | Rendering               | Auth Required | Purpose                                |
| ------------- | --------------------------------------------------- | ----------------------- | ------------- | -------------------------------------- |
| `(marketing)` | `/services/*`, `/locations/*`, `/blog/*`            | SSR (Server Components) | No            | Public SEO pages indexed by Google     |
| `(dashboard)` | `/dashboard/*`, `/content/*`, `/seo/*`, `/social/*` | Client + Server         | Yes           | Authenticated app for managing content |
| `api`         | `/api/v1/*`                                         | Node Runtime            | Yes (most)    | REST API for all operations            |

---

## Data Flow: Content Generation

```
User clicks "Generate Service Page"
    │
    ▼
Dashboard UI (client component)
    │ POST /api/v1/content/generate
    ▼
API Route (auth middleware → org scope)
    │
    ▼
BullMQ Queue: content-generation
    │
    ▼
Worker: calls Claude API with prompt template + org brand config
    │
    ▼
Supabase: saves generated content (status: "review")
    │
    ▼
Dashboard shows content in review queue
    │
    ▼
User reviews, edits, approves → status: "published"
    │
    ▼
Public SSR page renders published content at /services/[slug]
    │
    ▼
Google indexes the page → organic traffic
```

---

## Database Tables (Core)

```
organizations        — Multi-tenant root (branding, plan, settings)
users                — Auth users with org membership and roles
service_pages        — SEO-optimized service pages
location_pages       — SEO-optimized town/city pages
blog_posts           — AI-generated + human-edited blog content
content_calendar     — Master schedule for all content
social_posts         — Social media posts with performance data
reviews              — Aggregated from all platforms
review_requests      — Outbound review solicitations
seo_audits           — Weekly audit results with scoring
keyword_rankings     — Historical rank tracking (GSC daily sync)
google_connections   — OAuth2 tokens (AES-256-GCM encrypted), site URLs, GA4 property IDs
gsc_snapshots        — Daily sitemap + indexing snapshots from GSC sync
ga4_page_metrics     — Per-page daily analytics (sessions, users, pageviews, bounce rate, engagement)
ga4_snapshots        — JSONB snapshots (traffic_sources, device_breakdown, daily_totals)
lead_events          — Unified lead tracking
media_assets         — Generated images + videos with metadata
job_executions       — Background job logs for debugging
```

All tables include `organization_id` FK with Supabase RLS policies.

---

## Data Flow: GSC Sync

```
Admin clicks "Connect Google Search Console" in Settings
    │
    ▼
OAuth2 redirect → Google consent → callback with auth code
    │
    ▼
API Route: /api/auth/google/callback
    │ Exchanges code for tokens, encrypts with AES-256-GCM
    ▼
Supabase: google_connections (encrypted access/refresh tokens, site_url)
    │
    ▼
BullMQ Scheduler: daily cron at 6 AM (gsc-sync queue)
    │
    ▼
GSC Sync Worker: for each active connection
    │ 1. Decrypt tokens, auto-refresh if expired
    │ 2. Fetch search analytics (query + page + date dimensions)
    │ 3. Upsert keyword_rankings in batches of 500
    │ 4. Fetch sitemaps + indexing data → gsc_snapshots
    ▼
SEO Dashboard "Search Console" tab
    │ GET /api/v1/gsc/overview
    ▼
Displays: overview cards, top queries, top pages, indexing coverage
```

---

## Data Flow: GA4 Sync

```
Admin connects GA4 via Settings → OAuth2 with scope=analytics.readonly
    │
    ▼
Property Selector UI → POST /api/v1/integrations/ga4/select-property
    │ Saves ga4_property_id to google_connections row
    ▼
BullMQ Scheduler: daily cron (ga4-sync queue)
    │
    ▼
GA4 Sync Worker: for each connection with ga4_property_id
    │ 1. Decrypt tokens, auto-refresh if expired
    │ 2. Run GA4 Data API reports (page metrics, traffic sources, devices, daily totals)
    │ 3. Upsert ga4_page_metrics in batches
    │ 4. Store ga4_snapshots (traffic_sources, device_breakdown, daily_totals)
    ▼
SEO Dashboard "Analytics" tab
    │ GET /api/v1/ga4/overview
    ▼
Displays: overview cards, traffic trend chart, top pages, traffic sources, device breakdown
```

---

## Data Flow: Social Post Generation

```
User navigates to /social → "Generate" tab
    │
    ▼
SocialGenerateForm (client component)
    │ Selects platform (GBP / Instagram / Facebook)
    │ Fills topic, tone, keywords, platform-specific fields
    │ POST /api/v1/social/generate
    ▼
API Route (auth middleware → org scope → Zod validation)
    │
    ├─► Claude API: platform-specific prompt (maxTokens=1024, temp=0.8)
    │   Returns: { body, hashtags, cta_type, cta_url, image_prompt }
    │
    ├─► (Optional) Nano Banana 2: generate image from image_prompt
    │   Stored via Supabase Storage → media_assets row
    │
    ▼
Supabase: inserts social_posts row (status: "review")
    │
    ▼
Social dashboard shows post in list with platform preview
    │
    ▼
User reviews, edits, approves → PATCH /api/v1/social/[id]/status
    │
    ├─► Can schedule via content calendar (social_post content type)
    │   BullMQ publish worker handles scheduled publishing
    │
    ▼
Post marked "published" → ready for manual copy to platform
```

---

## Integration Adapters

| Category      | Interface             | Implementations                                            |
| ------------- | --------------------- | ---------------------------------------------------------- |
| CRM           | `CRMAdapter`          | HubSpotAdapter, WebhookAdapter                             |
| Reviews       | `ReviewAdapter`       | GoogleAdapter, YelpAdapter, AngiAdapter                    |
| Notifications | `NotificationAdapter` | SlackAdapter, EmailAdapter (Resend), SMSAdapter            |
| SMS           | `SmsAdapter`          | SalesMessageAdapter (review requests via SalesMessage API) |
| Publishing    | `PublishAdapter`      | GBPAdapter, NextJSAdapter (internal SSR pages)             |

Business logic imports the interface, never a specific adapter.
Factory pattern: `CRMAdapterFactory.create(org.crmType)`

---

## AI Stack

| Engine               | Provider  | Model                         | Use                               |
| -------------------- | --------- | ----------------------------- | --------------------------------- |
| Text                 | Anthropic | claude-sonnet-4-5             | Content gen, SEO analysis         |
| Text (complex)       | Anthropic | claude-opus-4-6               | Deep analysis only                |
| Images               | Google    | gemini-3.1-flash-image        | Graphics, thumbnails, heroes      |
| Video (programmatic) | Remotion  | React compositions            | Branded reels, tips, testimonials |
| Video (cinematic)    | Google    | veo-3.1-fast-generate-preview | Hero content, ads                 |

See @docs/video-guidelines.md for full decision logic and combination pipelines.

---

## Security Model

1. **Auth:** Supabase Auth issues JWT → JWT includes user_id
2. **API Middleware:** Extracts user_id from JWT → looks up organization_id
3. **RLS:** Every table has policy: `organization_id = auth.jwt()->>'org_id'`
4. **Defense in depth:** Even if API middleware fails, RLS blocks cross-tenant access
5. **Roles:** owner > admin > editor > viewer (stored in user_organizations join table)
