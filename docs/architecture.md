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

| Group         | Path                                     | Rendering               | Auth Required | Purpose                                |
| ------------- | ---------------------------------------- | ----------------------- | ------------- | -------------------------------------- |
| `(marketing)` | `/services/*`, `/locations/*`, `/blog/*` | SSR (Server Components) | No            | Public SEO pages indexed by Google     |
| `(dashboard)` | `/dashboard/*`, `/content/*`, `/seo/*`   | Client + Server         | Yes           | Authenticated app for managing content |
| `api`         | `/api/v1/*`                              | Node Runtime            | Yes (most)    | REST API for all operations            |

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
keyword_rankings     — Historical rank tracking
lead_events          — Unified lead tracking
media_assets         — Generated images + videos with metadata
job_executions       — Background job logs for debugging
```

All tables include `organization_id` FK with Supabase RLS policies.

---

## Integration Adapters

| Category      | Interface             | Implementations                                 |
| ------------- | --------------------- | ----------------------------------------------- |
| CRM           | `CRMAdapter`          | HubSpotAdapter, WebhookAdapter                  |
| Reviews       | `ReviewAdapter`       | GoogleAdapter, YelpAdapter, AngiAdapter         |
| Notifications | `NotificationAdapter` | SlackAdapter, EmailAdapter (Resend), SMSAdapter |
| Publishing    | `PublishAdapter`      | GBPAdapter, NextJSAdapter (internal SSR pages)  |

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
