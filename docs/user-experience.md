# Authority Engine — User Experience Guide

_Last Updated: March 8, 2026_

This document describes the complete user experience of Authority Engine as it exists today — every page, flow, and interaction a user or visitor encounters.

---

## Table of Contents

1. [Overview](#overview)
2. [Public Marketing Pages](#public-marketing-pages)
3. [Authentication](#authentication)
4. [Dashboard Shell](#dashboard-shell)
5. [Dashboard Home](#dashboard-home)
6. [Content Engine](#content-engine)
7. [Content Calendar](#content-calendar)
8. [Media Library](#media-library)
9. [Social & GBP](#social--gbp)
10. [Video Generation](#video-generation)
11. [SEO Command Center](#seo-command-center)
12. [Review Command Center](#review-command-center)
13. [Settings](#settings)
14. [Modules Not Yet Implemented](#modules-not-yet-implemented)

---

## Overview

Authority Engine is an AI-powered SEO & Growth Platform for home improvement companies. It automates content creation, SEO optimization, review management, and social media for painting contractors and similar businesses.

There are two distinct user experiences:

- **Public visitors** browse SEO-optimized service pages, location pages, and blog posts — server-rendered for Google indexing.
- **Authenticated users** (business owners, editors) manage content, reviews, SEO, social posts, and media from a dashboard.

---

## Public Marketing Pages

Public pages are server-side rendered (SSR) with Incremental Static Regeneration (1-hour cache). No login required. All pages include SEO metadata (Open Graph tags, meta title/description) for search engines and social sharing.

### Service Pages (`/services/[slug]`)

Displays AI-generated content for a specific service (e.g., "Exterior Painting", "Cabinet Refinishing").

**Layout:**

- Breadcrumbs: Home > Services > [Service Name]
- Page title (h1)
- Intro paragraph (lead text)
- Content sections (h2 headings with body text)
- Call-to-action footer (e.g., "Get Your Free Estimate")

### Location Pages (`/locations/[slug]`)

Displays AI-generated content for a specific service area (e.g., "Summit, NJ").

**Layout:**

- Breadcrumbs: Home > Locations > [City, State]
- Page title with city/state
- Subtitle: "Serving [City], [State]"
- ZIP codes served
- Content sections
- Call-to-action footer

### Blog Posts (`/blog/[slug]`)

Displays AI-generated blog articles.

**Layout:**

- Breadcrumbs: Home > Blog > [Post Title]
- Page title
- Metadata row: publication date, read time, category
- Featured image (if set)
- Intro quote (italicized)
- Content sections
- Tags row
- Call-to-action footer

---

## Authentication

Authority Engine uses passwordless magic link authentication via Supabase Auth. There are no passwords — users sign in by clicking a link sent to their email.

### Login Flow

1. **User visits any protected page** (e.g., `/dashboard`) — middleware redirects to `/login`
2. **Login page** displays a centered card with:
   - Cleanest Painting logo at the top
   - Title: "Sign in to Authority Engine"
   - Email input field
   - "Send Magic Link" button
3. **User enters email and submits** — Supabase sends a magic link to their inbox
4. **Confirmation state** — the form updates to show "Check your email" with the email address displayed
5. **User clicks magic link in email** — browser navigates to `/api/auth/callback`
6. **Callback processes the link:**
   - Exchanges the auth code for a session
   - Sets auth cookies
   - Auto-links the user to the default organization (first login only)
   - Redirects to `/dashboard`

### Route Protection

- All dashboard routes (`/dashboard`, `/content`, `/calendar`, `/seo`, `/reviews`, `/social`, `/settings`, etc.) require authentication
- Unauthenticated users are redirected to `/login` with a `?redirect=` parameter so they return to their intended page after login
- Already-authenticated users who visit `/login` are redirected to `/dashboard`

---

## Dashboard Shell

The dashboard is the authenticated application where users manage all platform features.

### Layout

```
+--------------------------------------------------+
|  [=]  Authority Engine          [User Avatar]    |
+----------+---------------------------------------+
|          |                                       |
| Sidebar  |  Main Content Area                    |
|          |  (current page renders here)           |
|          |                                       |
+----------+---------------------------------------+
```

### Sidebar Navigation

The left sidebar displays the organization logo, name, and the user's role. Below that, navigation items:

| Item         | Route        | Description                          |
| ------------ | ------------ | ------------------------------------ |
| Dashboard    | `/dashboard` | Overview metrics and activity        |
| Content      | `/content`   | AI content generation and management |
| Calendar     | `/calendar`  | Content scheduling                   |
| Media        | `/media`     | Image generation and library         |
| Social & GBP | `/social`    | Social media post generation         |
| Video        | `/video`     | Video generation (Remotion + Veo 3.1)|
| SEO          | `/seo`       | SEO scoring and Google integrations  |
| Reviews      | `/reviews`   | Review management and responses      |
| Community    | `/community` | (Not yet implemented)                |
| Analytics    | `/analytics` | Unified GA4 + GSC analytics          |

A **Settings** link appears at the bottom of the sidebar.

### User Menu

The top-right avatar (showing the first two letters of the user's email) opens a dropdown with:

- User's email address
- Link to Settings
- Sign out button

---

## Dashboard Home

**Route:** `/dashboard`

The landing page after login. Provides a high-level overview of platform activity.

### Hero Metric Cards

Four cards across the top:

- **Total Content** — count of all content items (service pages, location pages, blog posts)
- **Published** — count of published content
- **Avg SEO Score** — average on-page SEO score across all content
- **Media Assets** — count of generated images

### Content Pipeline Chart

A bar chart showing content by status: draft, review, approved, published, archived. Gives a quick view of how much content is in each stage of the workflow.

### Recent Activity Feed

A chronological list of recent actions: content generated, pages published, reviews received, images created. Each entry shows what happened, when, and the content type.

---

## Content Engine

**Route:** `/content`

The core module for generating AI-written content and managing it through a review workflow.

### Content Listing

A table of all content items across three types (service pages, location pages, blog posts). Each row shows:

- Title
- Content type badge
- Status badge (draft / review / approved / published / archived)
- SEO score
- Last updated date

Users can filter by content type and status. Clicking a row opens the detail sheet.

### Generating Content

Users click "Generate" to open the content generation form:

1. **Select content type:** Service Page, Location Page, or Blog Post
2. **Configure inputs** (varies by type):
   - **Service Page:** service name, description, target keywords
   - **Location Page:** city, state, ZIP codes, target keywords
   - **Blog Post:** topic, target keywords, tone
3. **Click "Generate"** — sends request to Claude API
4. Content is created with status **"review"** — it is never auto-published

### Content Detail Sheet

A right-side panel that opens when clicking a content item. Shows:

- Full content preview (headline, intro, sections)
- SEO score with rule-by-rule breakdown
- Status and metadata
- Action buttons based on current status and user role:
  - **In review:** Approve or Reject
  - **Approved:** Publish
  - **Published:** Archive
- Edit button to modify title, slug, content, and meta fields

### Content Review Workflow

All content follows this lifecycle:

```
Generate → review → approved → published → archived
                 ↘ rejected (back to draft)
```

- **review**: Content has been generated and needs human review
- **approved**: An editor/admin has approved the content
- **published**: Content is live on the public site at its slug URL
- **archived**: Content has been taken down

Role requirements: Editors can approve/reject. Admins can publish. Owners have full access.

### Editing Content

Users with appropriate roles can edit:

- Title and URL slug
- Content body (headline, intro, sections, CTA)
- Meta title and meta description
- Target keywords

Editing triggers an automatic SEO score recalculation.

---

## Content Calendar

**Route:** `/calendar`

A scheduling interface for planning when content goes live.

### Month Grid View

A traditional calendar grid showing the current month. Each day cell displays scheduled content entries as colored cards:

- Color-coded by content type (service page, location page, blog post, social post)
- Status dot with tooltip
- Overflow entries show a "+N more" link that opens a popover

Navigation arrows move between months.

### List/Agenda View

An alternative chronological view. Entries are grouped by date, showing:

- Scheduled date
- Content title
- Content type and status badges
- Click to open detail

Users toggle between grid and list views.

### Scheduling Content

Users click a "Schedule" button to open a dialog:

1. **Select content** from a dropdown of approved (unpublished) items, filtered by content type
2. **Pick a date and time**
3. **Confirm** — creates a calendar entry

A background worker (BullMQ) automatically publishes content when its scheduled time arrives.

### Entry Detail Sheet

Clicking a calendar entry opens a detail panel showing:

- Content title and type
- Scheduled date/time
- Current status
- Published timestamp (if published)
- Error details (if publish failed)
- Actions: Reschedule or Cancel

### Filters

Dropdowns to filter the calendar by:

- Content type (all, service page, location page, blog post, social post)
- Status (all, scheduled, published, cancelled, failed)

---

## Media Library

**Route:** `/media`

Generate AI images and manage the media library.

### Image Generation Form

Users fill out a form to generate images via Nano Banana 2 (Gemini Flash):

1. **Select template type:**
   - Blog Thumbnail — sized for blog featured images
   - Location Hero — hero images for location pages
   - Social Graphic — sized for social media posts
2. **Enter a prompt** describing the desired image
3. **Optional:** Link to a content item (associates the image with a page)
4. **Click "Generate"** — image is created and stored in Supabase Storage

### Media Grid

A grid of generated images showing:

- Thumbnail preview
- Image name/prompt
- Template type badge
- Creation date
- File size

Clicking an image opens the detail sheet.

### Media Detail Sheet

A right-side panel showing:

- Full-size image preview
- Metadata (dimensions, file size, type, creation date)
- Associated content item (if linked)
- Original prompt
- Delete action

---

## Social & GBP

**Route:** `/social`

Generate and manage social media posts for Google Business Profile, Instagram, and Facebook.

### Tab Navigation

Five tabs across the top:

- **All Posts** — every social post regardless of platform
- **GBP** — Google Business Profile posts only
- **Instagram** — Instagram posts only
- **Facebook** — Facebook posts only
- **Generate** — the generation form

### Social Post Generation

The Generate tab provides a form:

1. **Select platform:** GBP, Instagram, or Facebook
2. **Fill platform-specific fields:**
   - **GBP:** Topic, tone, keywords, CTA type (BOOK, CALL, LEARN_MORE, etc.)
   - **Instagram:** Topic, tone, keywords, hashtag count, carousel slide count
   - **Facebook:** Topic, tone, keywords, post format (standard, poll, event)
3. **Optional:** Check "Generate image" to auto-create a visual via Nano Banana 2
4. **Click "Generate"** — Claude API creates platform-optimized copy

Generated posts enter **"review"** status.

### Post List

Each platform tab shows posts filtered to that platform. Each post card shows:

- Post body preview
- Platform badge
- Status badge
- Hashtags (if applicable)
- Creation date

Clicking a post opens the detail sheet.

### Post Detail Sheet

Shows the full post with a platform-appropriate preview:

- **GBP:** Business post format with CTA button
- **Instagram:** Square image frame with caption and hashtags
- **Facebook:** Timeline post format

Actions (based on status and role):

- Approve / Reject
- Publish (marks as published — user manually copies to platform)
- Edit body, hashtags, CTA
- Copy to clipboard
- Schedule via content calendar

### Social Post Workflow

Same lifecycle as content: review → approved → published → archived. Posts can also be scheduled through the content calendar for timed publishing.

---

## Video Generation

**Route:** `/video`

Generate videos using two engines: **Remotion** (programmatic motion graphics) and **Veo 3.1** (cinematic AI video).

### Tab Navigation

Three tabs:

- **All Videos** — library of all generated videos (filterable by engine)
- **Generate** — video generation form with engine selection
- **Status** — track in-progress video generation jobs

### Engine Selection

The generate form starts with an engine selector:

- **Remotion** — branded motion graphics, text animations, data-driven video. Fast, low-cost (~$0.05–$0.15/video). Best for recurring social content.
- **Veo 3.1** — cinematic AI-generated video with synchronized audio. Higher cost ($0.15–$0.40/sec). Best for hero content and portfolio pieces.

The video type dropdown updates based on the selected engine.

### Remotion Video Types

Five programmatic video types rendered via React compositions at 1080×1920 (9:16):

- **Testimonial Quote** — animated customer review with star rating, branded background, and CTA overlay (6s @ 30fps)
- **Tip Video** — numbered tips with kinetic text reveal, title card, and branded styling (10s @ 30fps). Users add/remove tip items dynamically in the form.
- **Before/After Reveal** — wipe transition between two images with labels (8s @ 30fps). Users provide before/after image URLs.
- **Branded Intro** — logo animation with tagline for video openings (3s @ 30fps)
- **Branded Outro** — CTA with logo and contact info for video endings (3s @ 30fps)

Remotion form fields vary by type:
- All types: topic field
- Testimonial Quote: customer name, quote text, star rating (interactive picker)
- Tip Video: title, dynamic tip list with add/remove buttons
- Before/After Reveal: before image URL, after image URL, before/after labels

### Veo 3.1 Video Types

Four cinematic AI video types:

- **Cinematic Reel** — hero portfolio content, project transformations
- **Project Showcase** — before/after project videos
- **Testimonial Scene** — customer testimonial visualizations
- **Brand Story** — company narrative videos

Veo form fields:
1. **Select model:** Fast (default, $0.15/sec) or Standard (max fidelity, $0.40/sec)
2. **Select aspect ratio:** 9:16 (vertical, default), 1:1 (square), 16:9 (landscape)
3. **Fill type-specific fields** (topic, style, details vary per video type)
4. **Optional:** Generate a starting frame via Nano Banana 2 for visual anchoring

### Generation Process

Clicking "Generate" queues a background job via BullMQ:
- **Remotion jobs** go to the `remotion-rendering` queue — bundles the React composition, renders to MP4, uploads to Supabase Storage
- **Veo jobs** go to the `video-generation` queue — calls Veo API with polling, downloads result, uploads to storage

Generation takes 30 seconds–5 minutes depending on engine and complexity. The Status tab shows real-time progress with a progress bar.

### Video Library Grid

Grid display of generated videos showing:

- Video thumbnail/preview
- Video type badge
- **Engine badge** ("Remotion" or "Veo") for quick identification
- Model used (Fast/Standard — Veo only)
- Duration and file size
- Creation date

Users can filter by engine using a query parameter.

Clicking a video opens the detail sheet.

### Video Detail Sheet

A right-side panel showing:

- Video preview/player
- Metadata (type, engine, model, aspect ratio, duration, file size)
- Original prompt used
- Actions: Schedule (via content calendar), Delete

---

## SEO Command Center

**Route:** `/seo`

Monitor and improve SEO performance across three tabs.

### On-Page SEO Tab

Analyzes the SEO quality of all generated content using 10 built-in rules across 4 categories.

**Overview Cards:**

- Average SEO score (0–100)
- Content count by score range (excellent / good / needs work / poor)

**Score Distribution Chart:**
A visual breakdown of how many content items fall into each score range.

**Content List:**
All content items with their SEO scores, sortable. Clicking an item opens the SEO detail panel.

**SEO Detail Panel:**
Rule-by-rule breakdown for a specific page:

- Each rule shows: name, category, weight, pass/fail, points earned
- Categories: Title & Meta, Content Quality, Structure, Keywords
- Specific rules include: title length, meta description length, heading structure, keyword density, content length, internal links, image alt text, URL structure, readability, schema markup

SEO scores are automatically calculated when content is generated or edited.

### Search Console Tab

Displays data from Google Search Console (requires GSC connection in Settings).

**If not connected:** Shows a prompt to connect GSC in Settings.

**If connected:**

**Overview Cards (28-day window):**

- Total clicks (with trend vs. previous 28 days)
- Total impressions
- Average CTR
- Average position

**Top Queries Table:**
Keywords driving traffic — shows query, clicks, impressions, CTR, position, and position change indicator.

**Top Pages Table:**
Best-performing pages — shows URL (shortened), clicks, impressions, CTR, average position.

**Indexing Coverage:**

- Pages indexed vs. not indexed
- Sitemap status (submitted, pending, errors/warnings)

### Analytics Tab

Displays data from Google Analytics 4 (requires GA4 connection in Settings).

**If not connected:** Shows a prompt to connect GA4 in Settings.

**If connected:**

**Overview Cards (28-day window):**

- Sessions
- Users
- Pageviews
- Bounce rate

**Traffic Trend Chart:**
Daily sessions over the 28-day period, plotted as a line chart.

**Top Pages Table:**
Pages ranked by sessions, showing pageviews, users, bounce rate, and average engagement time.

**Traffic Sources Breakdown:**
Where traffic comes from — organic search, direct, social, referral, etc. — with session counts and percentages.

**Device Breakdown:**
Desktop vs. mobile vs. tablet split with session counts and percentages.

---

## Review Command Center

**Route:** `/reviews`

Manage customer reviews, generate AI responses, and request new reviews via SMS.

### Tab Navigation

Seven tabs:

- **All** — every review
- **Google** — Google Business Profile reviews
- **Yelp** — Yelp reviews
- **Angi's** — Angi's List reviews
- **Manual** — manually entered reviews
- **Overview** — aggregated metrics
- **Add Review** — manual entry form
- **Request Reviews** — SMS review request management

### Review List

Each tab shows reviews filtered by platform. Each review card displays:

- Reviewer name
- Star rating (1–5 stars, visually rendered)
- Platform badge (Google, Yelp, Angi's, Manual)
- Response status badge (pending, draft, review, approved, sent, archived)
- Review text preview
- Date received

Clicking a review opens the detail sheet.

### Review Detail Sheet

Full review display with:

- Complete review text
- Star rating
- Reviewer info and platform
- Date received

**Response section:**

- Current response draft (if any)
- Response status
- Action buttons based on status:
  - **No response yet:** "Generate Response" button
  - **Draft:** Edit, send for review
  - **In review:** Approve or reject
  - **Approved:** Mark as sent, or "Post to Google" (for Google reviews with GBP connected)
  - **Sent:** Archive
- Copy response to clipboard

### AI Response Generation

When clicking "Generate Response", a form appears:

1. **Select tone:** Appreciative, Empathetic, Professional, or Friendly
2. **Set max length** (optional)
3. **Custom instructions** (optional — e.g., "mention our spring special")
4. **Click "Generate"** — Claude API creates a response draft

The AI considers the review's star rating and content to craft an appropriate response. Generated responses include detected sentiment and key themes.

### Response Workflow

```
(no response) → draft → review → approved → sent → archived
```

- Generate creates a **draft**
- Editor sends to **review**
- Admin **approves** or rejects
- Approved responses can be **posted to Google** (via GBP API) or manually copied
- Finally **archived** when done

### Overview Tab

Aggregated metrics:

- **Average rating** across all reviews
- **Total review count**
- **Pending responses** (reviews needing attention)
- **Rating distribution** — bar chart showing count of 1-star through 5-star reviews
- **Platform breakdown** — reviews per platform
- **Sentiment breakdown** — positive / neutral / negative

### Manual Review Entry

A form for adding reviews that weren't automatically synced:

- Reviewer name
- Star rating (interactive star picker — click to set 1–5)
- Platform selector
- Review text
- External review URL (optional)

### Google Business Profile Sync

For organizations with GBP connected:

- A **"Sync"** button on the Google tab triggers a manual pull of recent Google reviews
- Reviews are deduplicated (won't create duplicates if already imported)
- A daily background sync also runs automatically

### Request Reviews Tab

Send SMS messages to customers asking them to leave a review.

**Review Request Form:**

- Customer name
- Phone number
- Platform (Google, Yelp, Angi's)
- Review URL (pre-filled based on platform selection)
- Custom message (optional — supports variables: `{name}`, `{org}`, `{url}`)

**Review Request List:**
Shows all sent requests with:

- Customer name and phone
- Platform
- Status badge (pending, sent, delivered, failed)
- Channel (SMS)
- Date sent

**Request Detail Sheet:**

- Full request details
- Timestamps (created, sent, delivered)
- Error info (if failed)
- Actions: Send SMS / Resend SMS (for pending or failed requests)

SMS messages are sent via SalesMessage with a background queue (BullMQ) handling delivery, rate limiting (50 messages per 60 seconds), and retry logic (3 attempts with exponential backoff).

---

## Settings

**Route:** `/settings`

Platform configuration, primarily for connecting external integrations.

### Integrations Section

Four integration rows:

| Integration             | Auth Method | Status Display                                 |
| ----------------------- | ----------- | ---------------------------------------------- |
| Google Search Console   | OAuth 2.0   | Connected (site URL shown) or "Connect"        |
| Google Analytics 4      | OAuth 2.0   | Connected (property shown) or "Connect"        |
| Google Business Profile | OAuth 2.0   | Connected (location shown) or "Connect"        |
| SalesMessage (SMS)      | API Key     | Configured or "Not configured" (env-var check) |

### Google OAuth Flow (GSC, GA4, GBP)

1. User clicks **"Connect"** next to an integration
2. Browser redirects to Google OAuth consent screen
3. User grants permission
4. Google redirects back to `/api/auth/google/callback`
5. Tokens are encrypted (AES-256-GCM) and stored
6. **For GA4:** A property selector appears — dropdown shows each GA4 property with its website URL (e.g., `cleanestpainting.com`) for easy identification. Rollup and sub-properties are filtered out so only usable properties appear. User picks which property to track.
7. **For GBP:** A location selector appears — user picks which business location to sync reviews from
8. Status updates to "Connected" with the connected resource name

Users can **disconnect** any integration, which removes stored tokens.

### SalesMessage

No OAuth flow — configured via environment variables (`SALESMESSAGE_API_KEY`, `SALESMESSAGE_NUMBER_ID`, `SALESMESSAGE_TEAM_ID`). The settings page shows whether the API key is configured.

---

## Analytics

**Route:** `/analytics`

A unified analytics dashboard combining Google Analytics 4 and Google Search Console data with keyword rank tracking.

### Date Range Picker

A persistent control at the top of the page. Users select a time window for all analytics data:

- **Preset buttons:** Last 7 days, Last 28 days (default), Last 90 days
- **Custom range:** Native date inputs for start and end dates
- Date range is stored in URL search params (`?range=28d`) so links are shareable

### Tab Navigation

Three tabs:

- **Overview** — unified metrics from GA4 + GSC + keyword summary
- **Keywords** — keyword rankings table with search and sorting
- **Search Performance** — reuses existing GSC components from /seo page

### Overview Tab

Combines data from GA4 and GSC into a single view:

- **GA4 metrics:** Sessions, users, pageviews, bounce rate (with comparison to previous period)
- **GSC metrics:** Total clicks, impressions, average CTR, average position
- **Keyword summary:** Total tracked keywords, average position, keywords improved vs. declined

Reuses existing GA4 and GSC sub-components (from `/seo` page) — no duplication.

If GA4 or GSC is not connected, those sections gracefully fall back with a connect prompt.

### Keywords Tab

A sortable, searchable table of keyword rankings populated by the daily GSC sync worker (no live API calls).

**Table columns:**

- Query (keyword text)
- Position (average, with up/down arrow indicating change vs. previous period)
- Clicks
- Impressions
- CTR

**Features:**

- **Search:** Filter keywords by text
- **Sort:** Click column headers to sort by any metric
- **Pagination:** Navigate through large keyword sets
- **Trend detail:** Click any keyword row to open a detail sheet

### Keyword Trend Detail Sheet

A right-side panel showing historical performance for a single keyword:

- **Summary cards:** Current position, position change, total clicks, total impressions
- **Chart:** Daily position and clicks plotted as a bar chart over the selected date range

### Search Performance Tab

Reuses the existing GSC dashboard components from the `/seo` page — top queries table, top pages table, and indexing coverage.

---

## Modules Not Yet Implemented

One sidebar item links to a placeholder page:

- **Community** (`/community`) — will monitor Facebook groups for lead intent and enable community posting (planned for Later milestone, post-V2)

---

_Document: Authority Engine User Experience Guide_
_Maintained by: Steven Rodas / Rodas Consulting Group_
