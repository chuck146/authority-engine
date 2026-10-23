# Cleanest Painting — Search & AI Visibility Playbook

_Prepared 2026-10-19 on branch `feature/seo-aeo-improvements`. Nothing in this branch is deployed._

This playbook covers how cleanestpaintingnj.com is found by Google and by AI search tools (ChatGPT search, Google AI Overviews / AI Mode, Perplexity, Gemini), how estimate requests are measured, and what the owner needs to do outside the code.

Related files:

- [topic-map.md](topic-map.md): customer questions mapped to pages
- [content-drafts/](content-drafts/): first drafts of answer-first copy and FAQs for six pages
- [ai-visibility-prompts.md](ai-visibility-prompts.md): monthly manual AI visibility check

---

## A. Audit findings (2026-10-19)

**How the site works.** Next.js 15 App Router on Vercel, in the `(marketing)` route group. Content lives in Supabase tables and is read in `lib/queries/content.ts`. Pages are server-rendered React; there is no CMS beyond the Authority Engine dashboard.

**Observed on the live site** (curl as Googlebot, plus a repo read):

| #   | Finding                                                                                                                                                                          | Status in this branch                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Every page title ended in "\| Authority Engine" (the platform name). `/login` and the 404 page were titled "Authority Engine".                                                   | Fixed                                                                                                                                         |
| 2   | Pages rendered dynamically on every request (`cache-control: private, no-store`), even though they were set up for 1-hour ISR. Cause: cookie-based Supabase client.              | Fixed — 49 routes now prerendered                                                                                                             |
| 3   | The sitemap was frozen at build time, so a published blog post was missing from it.                                                                                              | Fixed — revalidates hourly and on publish                                                                                                     |
| 4   | `www.cleanestpaintingnj.com` served a 200 instead of redirecting to the apex.                                                                                                    | Fixed (308 in `next.config.ts`)                                                                                                               |
| 5   | JSON-LD: `streetAddress: "Rahway"`, relative logo URL, no `@id`, tagline used as the description, and location pages swapped the business's service area for a single town.      | Fixed — one `HousePainter` entity with a stable `@id`                                                                                         |
| 6   | Different contact details in different places: `/privacy` and `/terms` showed (732) 913-8574, the footer map was centered on New York, NY, and the footer said "Rahway, Rahway". | Fixed — all read from org settings                                                                                                            |
| 7   | Service area described inconsistently: "all of New Jersey" in some places, 4 counties in others.                                                                                 | Fixed — owner chose Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen (2026-10-22); `/locations` lists only those counties |
| 8   | No client analytics installed (and the CSP would have blocked GA4). Every lead was recorded as `source='website'`, with no referrer, UTM, or "how did you hear about us".        | Fixed (see Measurement)                                                                                                                       |
| 9   | The estimate form existed only on the homepage, so every CTA sent people to `/#estimate`.                                                                                        | New `/estimate` page with the service preselected                                                                                             |
| 10  | Homepage and hub content was `opacity-0` in the server HTML until JavaScript ran.                                                                                                | Fixed — visible by default                                                                                                                    |
| 11  | `robots.txt` used `Disallow: /dashboard/` (trailing slash), which doesn't match `/dashboard`. `/login` was indexable.                                                            | Fixed (`/login` and the dashboard are also `noindex`)                                                                                         |
| 12  | Content prompts asked for "why choose us" with no rule against invented facts, and a sprint script auto-published pages scoring 80 or more.                                      | Guardrails added; auto-publish removed                                                                                                        |
| 13  | Thin service pages (about 250 words of body copy), no FAQs, no cost or timeline factors.                                                                                         | FAQ support added; drafts in `content-drafts/`                                                                                                |
| 14  | Public page lookups weren't scoped to the organization (multi-tenant risk).                                                                                                      | Fixed                                                                                                                                         |

**Not verified (no access):** live Google indexing and AI citations, Vercel firewall / bot-protection settings, production `NEXT_PUBLIC_SITE_URL`, GA4 data quality, competitor visibility.

**Known limitation:** an unknown slug under an existing section (e.g. `/services/not-real`) returns a correct **404 status** with the right title, but its HTML body is filled in by JavaScript. Production behaves the same today. Search engines drop 404s regardless of body content, so this is low impact.

---

## B. Backlog

| Priority | Item                                                                                 | Value                                              | Effort | Status                                                     |
| -------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- | ------ | ---------------------------------------------------------- |
| P0       | Business name in titles; branded 404; robots fix; www redirect                       | Correct brand in search results; no duplicate host | S      | ✅ Done                                                    |
| P0       | Static/ISR marketing pages; sitemap revalidation; org-scoped queries                 | Faster pages, fresh sitemap, tenant safety         | M      | ✅ Done                                                    |
| P0       | One business identity for visible contact details and JSON-LD                        | Consistent entity for Google and AI answers        | M      | ✅ Done                                                    |
| P1       | `/estimate` page, preselected service, honeypot                                      | Fewer steps to a lead                              | M      | ✅ Done                                                    |
| P1       | Lead attribution, call-click events, optional GA4                                    | Know which channels produce booked jobs            | M      | ✅ Code done. **Migration + GA4 ID pending**               |
| P2       | FAQ field; crawlable animations; no-fabrication prompts; internal links              | Answerable content; accurate claims                | M      | ✅ Done                                                    |
| P2       | Load reviewed FAQ and intro drafts into the six pages                                | Pages that answer real customer questions          | S each | ⏳ Owner review of `content-drafts/` first                 |
| P2       | Resolve the paint-brand contradiction ("BM & SW exclusively" vs Farrow & Ball copy)  | Trust; consistent AI answers                       | S      | Decided: BM & SW; live page edits pending                  |
| P3       | Rahway (home base), Montclair, West Orange location pages, one at a time             | Local coverage                                     | S each | ⏳ Owner confirms coverage, then generate in the dashboard |
| P3       | Project case studies (`/projects`) with real photos, town, scope, duration, products | Strongest evidence for people and AI answers       | M      | ⏳ Needs real project assets                               |
| P3       | Fix keyword-stuffed location page titles (e.g. "Painters Westfield NJ")              | Clearer listings                                   | S      | Backlog                                                    |

---

## C. What changed in code

- **Titles and indexing:** `app/(marketing)/layout.tsx`, `app/not-found.tsx`, `app/(marketing)/not-found.tsx`, `app/robots.ts`, `app/(auth)/layout.tsx`, `app/(dashboard)/layout.tsx`, `next.config.ts`
- **Caching and freshness:** `lib/queries/content.ts`, `app/sitemap.ts`, `lib/marketing/revalidate.ts`, and the publish routes
- **Identity and structured data:** `lib/seo/business.ts`, `lib/seo/json-ld.ts`, `components/marketing/site-footer.tsx`, `app/(marketing)/privacy|terms/page.tsx`
- **Conversion:** `app/(marketing)/estimate/page.tsx`, `lib/marketing/estimate.ts`, `components/marketing/home/estimate-form.tsx`
- **Measurement:**
  - `lib/leads/attribution.ts`, `lib/analytics/client.ts`, `components/marketing/{attribution-capture,tracked-phone-link,ga4}.tsx`
  - `app/api/v1/leads/route.ts`, `app/api/v1/events/route.ts`
  - migration `20261019000001_add_lead_attribution_and_marketing_events.sql`
  - Leads dashboard cards and lead detail sheet
- **Content:** `types/content.ts` (optional `faqs`), `components/marketing/content-body.tsx`, `components/marketing/scroll-reveal.tsx`, `packages/ai/prompts/content/shared.ts` (facts guardrail), sprint scripts

---

## Crawler policy (robots.txt)

Robots.txt controls crawling. It is **not** security: the dashboard is protected by authentication.

| Agent                        | Purpose                                                                                        | Current setting                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| Googlebot                    | Google Search, including AI Overviews / AI Mode                                                | Allowed (public pages)                          |
| Google-Extended              | Use of content for Gemini training/grounding. **Does not affect Search inclusion or ranking.** | Allowed via `*`. Owner decision                 |
| OAI-SearchBot                | ChatGPT search results                                                                         | Allowed explicitly                              |
| GPTBot                       | OpenAI model training                                                                          | Allowed via `*`. Owner decision                 |
| ChatGPT-User / Claude-User   | Fetches made when a user asks about a page; robots.txt may not apply                           | n/a                                             |
| Claude-SearchBot / ClaudeBot | Claude search vs. training                                                                     | SearchBot explicitly allowed; ClaudeBot via `*` |
| PerplexityBot, Bingbot       | Search indexes                                                                                 | Allowed explicitly                              |

Google says AI features need no special markup, AI text files, or llms.txt. A page only needs to be indexed and eligible for a snippet. Sources:

- [Google AI features](https://developers.google.com/search/docs/appearance/ai-features)
- [Google crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [OpenAI bots](https://developers.openai.com/api/docs/bots)

To block a training crawler, add it to `app/robots.ts` as its own group with `disallow: '/'`.

---

## Measurement definitions

| Term                      | Definition                                                                                                                                                                | Where it's recorded                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Estimate request**      | Form accepted by the server (HTTP 201). Honeypot submissions are not stored.                                                                                              | `leads` row; GA4 `generate_lead` (fires only after the 201) |
| **Call click**            | Tap or click on any marketing `tel:` link. Shows intent only, not a completed call.                                                                                       | `marketing_events`; GA4 `call_click`                        |
| **Qualified lead**        | Lead moved to `qualified`, `proposed`, or `won` in the Leads dashboard                                                                                                    | `leads.status`                                              |
| **Booked job**            | Lead marked `won`                                                                                                                                                         | `leads.status`                                              |
| **Observed channel**      | Classified from first-touch referrer host + UTM tags: `ai_assistant`, `organic_search`, `google_business_profile`, `paid_search`, `social`, `email`, `referral`, `direct` | `leads.attribution.channel`                                 |
| **AI assistant referral** | Referrer host is chatgpt.com, chat.openai.com, perplexity.ai, gemini.google.com, copilot.microsoft.com, claude.ai, or meta.ai, **or** `utm_source` names one of them      | `lib/leads/attribution.ts`                                  |
| **Reported discovery**    | The customer's own answer to "How did you hear about us?"                                                                                                                 | `leads.discovery_source`                                    |

**Attribution gaps (read before drawing conclusions):**

- Many AI answers send no referrer, so those visits show up as `direct`. Compare observed channel with reported discovery.
- Attribution is first-touch for 30 days in the visitor's browser. It is lost if the visitor clears storage or switches devices.
- Bot visits in server logs show **access**, not citations or leads.
- No personal data goes to GA4 or into attribution: only path, referrer host, UTM tags, and a gclid yes/no.

**Deploy order:**

1. ✅ Merged (PR #25) and deployed.
2. ✅ Migration applied on 2026-10-22 through the Supabase SQL editor. It isn't recorded in Supabase's migration history, so before the next `npm run db:migrate` run `supabase migration repair --status applied 20261019000001`.
3. ✅ `types/database.ts` updated for the new columns and table. Regenerate it with `npx supabase gen types typescript --project-id oznuqgcipfjfbxvflbhc > types/database.ts` the next time the CLI is logged in.
4. Set `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-…` in Vercel (Production) and redeploy.
5. In GA4, mark `generate_lead` as a key event.
6. ✅ The temporary "migration not applied" fallbacks are removed (branch `fix/remove-attribution-fallbacks`).

**Caching:** marketing pages are cached for up to an hour. Publishing or unpublishing through the dashboard refreshes them right away. Edits made directly in the database (org settings such as phone or counties, or page content changed outside the dashboard) appear within an hour, or immediately after a redeploy.

---

## F. Owner checklist

**Facts to confirm** (private, do not publish until confirmed):

- [x] HIC number: corrected to 13VH11564300 (owner, 2026-10-22). The trust bar now shows it.
- [x] Phone numbers (owner, 2026-10-22): (732) 496-4607 is the direct line used everywhere. (732) 913-8574 is the Twilio texting number; `/privacy` and `/terms` show it in their SMS sections and contact lists (`MARKETING_SMS_PHONE` in lib/marketing/site.ts). It is not used in structured data.
- [x] Paint brands: Benjamin Moore & Sherwin-Williams (owner, 2026-10-22).
- [ ] Remove Farrow & Ball / Fine Paints of Europe mentions from five live pages: services `interior-painting`, `color-consultation`; locations `westfield-nj-painting`, `short-hills-nj-painting`, `bernardsville-nj-painting`.
- [x] Projects outside the eight counties are accepted by request (owner, 2026-10-22). Shown on the homepage town list and `/locations`.
- [x] Service area: Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen counties (owner, 2026-10-22). Hudson, Monmouth and Bergen added the same day. Woodbridge (Middlesex) stays.
- [x] Live org settings: `settings.service_area_counties` set to all eight counties (2026-10-22, owner-approved). Live JSON-LD picks it up now; the hero, footer and `/locations` follow once this branch is deployed.
- [ ] Are Rahway, Montclair, and West Orange served? Are drywall repair, trim/carpentry, and fence staining offered?
- [ ] Lead-safe (EPA RRP) certification: needed before publishing any pre-1978 / lead paint FAQ.
- [ ] Price ranges and typical timelines you're willing to publish (see `[CONFIRM]` placeholders in the drafts).
- [ ] Add owner-confirmed claims to `organizations.settings.verified_facts` (e.g. "Licensed and insured", "Angi Super Service 2024") so AI-generated drafts can use them.

**Account settings:**

- [ ] Vercel → Firewall / Bot protection: make sure Googlebot, Bingbot, and OAI-SearchBot are not challenged or blocked.
- [ ] Vercel → Domains: optionally also set www → apex as a redirect there (the code already does it).
- [ ] Decide on training crawlers (GPTBot, Google-Extended, ClaudeBot, CCBot).
- [ ] GA4 measurement ID + key event (see Deploy order).
- [ ] Google Search Console: after deploy, resubmit `sitemap.xml` and inspect `/`, `/estimate`, and one service page.

**External marketing** (none of this was done by the code changes):

- [ ] Google Business Profile: primary category "Painter"; services list matches the site; phone (732) 496-4607; website URL is the apex domain.
- [ ] Same name, phone, and city on Angi, Yelp, Facebook, Instagram, Nextdoor, and BBB.
- [ ] Ask every completed customer for a Google review through the existing SalesMessage review-request flow.
- [ ] Capture before/after photos and a short walkthrough video for each job (town, scope, days on site, products). These become case studies.
- [ ] Local mentions: HOA newsletters, town business directories, supplier "find a contractor" listings, if they genuinely apply.

---

## G. 30-day plan (from deploy)

| Week | Content                                                                                                               | Measurement                                                                                                                                  |
| ---- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Owner reviews drafts for interior + exterior; answers the `[CONFIRM]` items; load FAQs + intros through the dashboard | Set GA4 ID; check GSC coverage; run [ai-visibility-prompts.md](ai-visibility-prompts.md) once for a baseline                                 |
| 2    | Cabinet + deck pages; resolve paint-brand wording; fix 3–4 stuffed location titles                                    | First look at the Leads → "Leads by Channel" and "How They Heard About Us" cards                                                             |
| 3    | First real project case study (photos, town, scope, timeline); decide on Rahway page                                  | Compare GSC queries with the [topic map](topic-map.md); add questions people actually search for                                             |
| 4    | Wallpaper page + one cost-factors blog post, if the owner confirms price ranges                                       | Rerun the AI prompt sample; report leads → qualified → won by channel; `npx tsx scripts/seo-sprint/04-technical-audit.ts` against production |

Report monthly, keeping these four separate: **referral visits** (GA4/attribution), **observed mentions/citations** (prompt sample), **customer-reported discovery**, and **leads → qualified → won**.
