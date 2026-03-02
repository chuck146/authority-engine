# Authority Engine — Project Spec

## Part 1: Product Requirements

### What are you actually trying to do?

Build an AI-powered SEO & Growth Platform that automates content creation, SEO optimization, review management, and community engagement for home improvement companies. Cleanest Painting LLC is the first customer. White-labeled to other companies via Rodas Consulting Group.

### Who is the product for?

- **Primary:** Painting contractors and home improvement companies ($500K–$10M revenue)
- **Secondary:** Marketing agencies serving home improvement verticals
- **Internal:** Cleanest Painting LLC as proof-of-concept and daily driver

### What problems does it solve?

- Home improvement companies have zero time for SEO, content, or social media
- Hiring an agency costs $2K–$5K/month with generic results
- No visibility into SEO health, keyword rankings, or review performance
- Lead generation relies entirely on paid platforms (Thumbtack, Angi's)
- Zero organic traffic because no service pages, location pages, or blog content exists

### What does the product do?

Five modules: SEO Command Center, AI Content Engine, Review Command Center, Community Lead Capture, Analytics & Reporting. Full specs in @docs/PRD.md.

---

### Milestones

#### 🟢 MVP — AI Content Generator + Auth + Database

**Goal:** Generate SEO-optimized service pages, location pages, and blog posts via Claude API. Ship to Cleanest Painting.

**Scope:**

- Supabase Auth (email + magic link) with multi-tenant org model
- Database schema: organizations, users, service_pages, location_pages, blog_posts
- RLS policies on all tables (organization_id scoping)
- Dashboard shell: sidebar nav, org context, auth guards
- AI Content Generator UI: select content type → configure → generate → review → edit → publish
- Claude API integration for text generation (service pages, location pages, blog posts)
- Content listing with status (draft → review → approved → published)
- Public SSR routes for published pages (Next.js Server Components)
- Seed data for Cleanest Painting (services, towns, brand config)

**Success Criteria:** Generate and publish 5 service pages + 10 location pages for Cleanest Painting. Pages are SSR, indexable by Google, and live on the domain.

---

#### 🔵 V1 — SEO Scoring + Image Generation + Content Calendar

**Goal:** See SEO health, auto-generate images for content, and schedule publishing.

**Scope:**

- SEO Health Score (on-page analysis of generated pages)
- Google Search Console integration (keyword rankings, traffic data)
- Google Analytics 4 integration (page performance)
- Nano Banana 2 image generation (blog thumbnails, social graphics, location heroes)
- Content calendar with scheduling (queue content for future publishing)
- GBP post generation and publishing
- Social media post generation (Instagram, Facebook)
- Basic dashboard with traffic + content metrics

**Success Criteria:** Cleanest Painting's SEO score visible, content scheduled weekly, images auto-generated.

---

#### 🟡 V2 — Reviews + Video + Community

**Goal:** Automate review management, add video content, capture leads from Facebook groups.

**Scope:**

- Review aggregation (Google, Yelp, Angi's)
- Automated review request SMS (Twilio/SalesMessage)
- AI review response drafts
- Remotion video generation (testimonial reels, project showcases, tip videos)
- Veo 3.1 for cinematic hero content
- Facebook group monitoring and posting (Brand24 + Graph API)
- Lead intent classifier for community posts
- Slack notifications for lead alerts

**Success Criteria:** Reviews monitored, 4+ videos/month auto-generated, community leads captured.

---

#### 🟣 Later — White-Label + Advanced Analytics + Marketplace

**Goal:** Multi-tenant admin for Rodas Consulting clients. Advanced reporting.

**Scope:**

- White-label admin panel (onboard new orgs, configure branding)
- Billing integration (Stripe) for subscription management
- Advanced analytics (competitor tracking, market share estimates)
- Keyword rank tracking with historical trends
- A/B testing for content variations
- Email marketing integration (Resend)
- Custom report builder

---

#### ⚫ Not In Scope (Infrastructure / Maintenance)

- CI/CD pipeline (GitHub Actions → Vercel)
- Error monitoring (Sentry)
- Logging infrastructure (structured logs)
- Database backup automation
- Rate limiting and abuse prevention
- GDPR/privacy compliance tooling
- Load testing and performance benchmarks
- Security audit and penetration testing

---

## Part 2: Technical Design

### Frontend

- **Framework:** Next.js 15 (App Router) — SSR for SEO pages, RSC by default
- **Styling:** Tailwind CSS + Shadcn/ui component library
- **State:** Zustand (client), TanStack Query (server), react-hook-form (forms)
- **Deployment:** Vercel

### Programming Language

- **TypeScript** (strict mode) — frontend, backend, shared types
- **Python** — SEO audit microservice only (FastAPI)

### Backend

- **API:** Next.js Route Handlers (App Router `/app/api/`)
- **Background Jobs:** BullMQ + Redis
- **Microservices:** Python FastAPI for SEO audits, Remotion for video

### Database

- **PostgreSQL** via Supabase
- **RLS** for multi-tenant isolation
- **Migrations** via Supabase CLI

### Auth

- **Supabase Auth** — email + magic link
- **JWT** tokens feed RLS policies via `auth.uid()`
- **Role-based access:** owner, admin, editor, viewer

### Email

- **Resend** — transactional emails (invites, notifications, reports)

### Payment (V2/Later)

- **Stripe** — subscription billing for white-label clients

### Cloud

- **Vercel** — Next.js hosting + serverless functions
- **Supabase** — database + auth + storage
- **Redis** — BullMQ job queue (Upstash or Railway)
- **Cloudflare R2** — large file storage (video renders)
- **Modal.com** — Python microservice hosting (SEO audits)

### Object Storage

- **Supabase Storage** — images, documents, org assets
- **Cloudflare R2** — video files, large media

### AI Models

- **Claude API (Anthropic)** — text content generation, SEO analysis, sentiment
- **Nano Banana 2 (Gemini 3.1 Flash Image)** — image generation
- **Remotion** — programmatic video (React compositions)
- **Veo 3.1 (Google)** — cinematic AI video

---

## Part 3: Technical Architecture

See @docs/architecture.md for system design diagram and component relationships.

Key architectural decisions:

1. **Next.js App Router** — Route groups: `(dashboard)` for app, `(marketing)` for public SSR pages
2. **Multi-tenant RLS** — Every table has `organization_id`, scoped via Supabase RLS
3. **Adapter pattern** — CRM, reviews, notifications abstracted behind interfaces
4. **AI content review gate** — All generated content requires human approval before publishing
5. **Background jobs** — BullMQ for content generation, image gen, video render, SEO audits
6. **Edge-first** — Vercel Edge Runtime for public pages, Node runtime for API routes

### Accounts & API Keys Required

- [ ] Supabase project (database + auth + storage)
- [ ] Vercel account (deployment)
- [ ] Anthropic API key (Claude)
- [ ] Google AI Studio / Gemini API key (Nano Banana 2, Veo 3.1)
- [ ] Google Search Console access (Cleanest Painting domain)
- [ ] Google Analytics 4 property
- [ ] Google Business Profile API access
- [ ] Resend API key (email)
- [ ] Upstash Redis (BullMQ queue)
- [ ] Cloudflare R2 bucket
- [ ] Stripe account (Later milestone)
- [ ] Twilio/SalesMessage (V2 milestone)
- [ ] Brand24 API key (V2 milestone)
- [ ] Facebook Graph API access (V2 milestone)
