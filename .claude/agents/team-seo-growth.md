# Team Agent: SEO Growth Sprint

Use to run a full-funnel SEO optimization sprint for a tenant. Analyzes GSC/GA4 data, fills content gaps, optimizes existing pages, distributes via social channels, and audits technical SEO + conversion paths.

Designed to be run monthly with fresh analytics data each cycle.

---

## When to Use

- Monthly SEO optimization cycle (after GSC/GA4 sync)
- After publishing a batch of new content (optimize + distribute)
- When organic traffic plateaus and needs a growth push
- Before a seasonal campaign (e.g., spring painting season)

---

## Spawn Prompt Template

```
Run an SEO growth sprint for [ORG_NAME] targeting [cleanestpaintingnj.com].

Organization context:
- Services: [LIST e.g., Interior Painting, Exterior Painting, Cabinet Refinishing]
- Locations: [LIST e.g., Summit NJ, Westfield NJ, Cranford NJ, Short Hills NJ]
- Current content: [X service pages, Y location pages, Z blog posts published]
- Goal: [e.g., "Increase organic traffic 30% in 60 days", "Rank top 10 for 'interior painting Summit NJ'"]

Before spawning teammates, gather baseline data:
1. GET /api/v1/analytics/overview — current traffic, impressions, avg position
2. GET /api/v1/analytics/keywords — all tracked keywords with positions
3. GET /api/v1/analytics/content-performance — page-level GA4 metrics
4. GET /api/v1/seo — current SEO scores for all published content
5. GET /api/v1/gsc/overview — indexing coverage, top queries, top pages

Share this baseline data with all teammates so they work from the same foundation.

Create an agent team with 4 SEO specialists:

**Teammate 1 — Content Gap Analyst & Writer**
Role: Find content gaps from GSC keyword data and generate new pages to fill them.
Instructions:
- Analyze keyword_rankings for striking-distance keywords (positions 11-30) — these are closest to page 1
- Identify high-impression, low-click keywords (CTR < 2%) — content exists but isn't compelling enough
- Find missing service×location combinations (e.g., "cabinet refinishing Cranford NJ" has no page)
- Cross-reference existing service_pages, location_pages, blog_posts to confirm gaps
- Generate new content using existing prompt templates:
  - Read packages/ai/prompts/content/service-page.ts for service pages
  - Read packages/ai/prompts/content/location-page.ts for location pages
  - Read packages/ai/prompts/content/blog-post.ts for blog posts
- For striking-distance keywords, prioritize blog posts that target long-tail variations
- Save all generated content with status "review"
- Use Supabase MCP to verify pages were saved correctly
Deliver: List of new pages with slugs, target keywords, and search volume context. Message Teammate 2 with new slugs for internal linking. Message Teammate 3 with top-performing keywords for social alignment.

**Teammate 2 — On-Page SEO Optimizer**
Role: Audit and fix all published pages using the SEO scoring engine.
Instructions:
- Read lib/seo/rules.ts and lib/seo/scorer.ts to understand the 10 scoring rules and 4 categories
- Fetch current SEO scores via GET /api/v1/seo (overview with all pages)
- Prioritize pages with scores below 70 — these have the most room for improvement
- For each underperforming page, fetch detail via GET /api/v1/seo/[type]/[id] for rule-by-rule breakdown
- Fix common issues via PUT /api/v1/content/[type]/[id]:
  - Meta titles: 50-60 chars, primary keyword near the front
  - Meta descriptions: 150-160 chars, include CTA and keyword
  - Content length: minimum 800 words for service pages, 600 for location pages
  - Heading structure: H1 with primary keyword, H2s for sections, H3s for subsections
  - Keyword density: 1-3% for primary keyword, natural placement
  - Internal links: add cross-links to related service/location/blog pages
- After Teammate 1 shares new page slugs, add internal links from existing pages to new content
- Build a site-wide internal linking map: service ↔ location ↔ blog cross-references
- Re-score all edited pages to confirm improvement
Deliver: Before/after SEO score comparison for all optimized pages. Internal linking map showing all cross-references.
Dependency: Wait for Teammate 1 to share new page slugs before building final link map.

**Teammate 3 — Social & GBP Distribution Strategist**
Role: Generate social posts promoting top content and schedule across 2 weeks.
Instructions:
- Read packages/ai/prompts/social/ for platform-specific prompt templates (GBP, Instagram, Facebook)
- Analyze baseline data to identify top-performing pages (highest sessions, impressions, or CTR)
- After Teammate 1 shares top keywords, align social content with those search terms
- Generate social posts via POST /api/v1/social/generate:
  - GBP posts: 4 posts (2/week) — focus on local services, include keywords from GSC top queries
  - Instagram posts: 4 posts (2/week) — visual storytelling, before/after project highlights, tips
  - Facebook posts: 4 posts (2/week) — community engagement, seasonal content, testimonial highlights
- Each post should link back to a published service/location/blog page (internal traffic driver)
- Schedule all posts via content calendar POST /api/v1/calendar — spread across next 14 days
- Ensure post topics don't overlap (variety across platforms)
Deliver: 12 scheduled social posts with platform, publish date, linked page, and target keywords. Calendar screenshot or summary showing 2-week distribution.
Dependency: Wait for Teammate 1 to share keyword data before finalizing post topics.

**Teammate 4 — Technical SEO & Conversion Auditor**
Role: Audit site health, indexing, mobile UX, and estimate form conversion path using Playwright MCP.
Instructions:
- Use Playwright MCP to visit cleanestpaintingnj.com and audit:
  1. **Indexing coverage:** Check GSC indexing data, verify all published pages return 200 status, no orphan pages
  2. **Mobile responsiveness:** Test 3-5 key pages on mobile viewport (375×667), check for horizontal scroll, tap targets, font sizes
  3. **Schema markup:** Verify LocalBusiness JSON-LD on homepage, Service schema on service pages, BreadcrumbList on all pages
  4. **Open Graph tags:** Check og:title, og:description, og:image on all page types — critical for social sharing
  5. **Page speed indicators:** Check for render-blocking resources, unoptimized images, missing lazy loading
  6. **Estimate form conversion path:** Walk through the full flow — homepage CTA → estimate form → submission. Check form loads, fields work, submit succeeds, thank-you state appears
  7. **Internal link health:** Spot-check 10 internal links for 404s or redirect chains
  8. **Sitemap:** Verify /sitemap.xml exists and includes all published pages
- For each issue found, create a severity-ranked list (critical / high / medium / low)
- Critical issues: broken estimate form, 404 on published pages, missing indexing
- High issues: missing schema markup, broken OG tags, mobile layout breaks
- Medium issues: slow loading images, missing alt text, redirect chains
- Low issues: minor styling issues, optional schema enhancements
Deliver: Technical SEO audit report with severity-ranked issues and recommended fixes. Estimate form conversion test results (pass/fail with screenshots if possible).

After all teammates complete:
1. Lead compiles sprint summary:
   - New content created (count by type, target keywords)
   - SEO scores improved (before/after averages)
   - Social posts scheduled (count by platform, date range)
   - Technical issues found (count by severity)
2. Compare baseline metrics to expected impact
3. Create action items for any critical/high technical issues
4. Update docs/project_status.md with sprint results
5. All new content in "review" status — ready for human approval in dashboard
```

---

## Communication Protocol

1. **Baseline data sharing:** Lead gathers all analytics data and shares with ALL teammates before they start
2. **Keyword handoff:** Teammate 1 messages Teammates 2 and 3 with striking-distance keywords and new page slugs
3. **Slug handoff:** Teammate 1 messages Teammate 2 with new content slugs for internal linking
4. **Blocker escalation:** Any teammate messages the Lead if blocked for more than 5 minutes
5. **File conflict prevention:** Teammates work through APIs (not direct file edits), so conflicts are minimal
6. **Completion signal:** Each teammate messages the Lead with a summary when done

---

## Git Worktree Strategy

This sprint primarily uses existing APIs rather than writing new code, so worktree isolation is lighter:

```bash
# Lead creates worktrees for teammates that may generate code fixes
git worktree add ../ae-seo-content feature/seo-sprint-content
git worktree add ../ae-seo-optimize feature/seo-sprint-optimize
git worktree add ../ae-seo-social feature/seo-sprint-social
git worktree add ../ae-seo-audit feature/seo-sprint-audit

# After sprint, merge any code changes into main
git checkout main
git merge feature/seo-sprint-content
git merge feature/seo-sprint-optimize
git merge feature/seo-sprint-social
git merge feature/seo-sprint-audit
```

---

## Expected Output

For a typical monthly sprint (painting company, 8 services × 12 towns):

- 3-8 new content pages (blog posts + gap-filling location/service pages)
- 10-20 pages with improved SEO scores (avg +15 points)
- 12 social posts scheduled across 2 weeks (4 GBP + 4 Instagram + 4 Facebook)
- 1 technical audit report with severity-ranked issues
- 1 conversion path test result (estimate form)

---

## Cost Estimate

| Phase                   | Teammates | Est. Duration  | Est. Cost   |
| ----------------------- | --------- | -------------- | ----------- |
| Baseline data gathering | 1 (lead)  | 5 min          | $0.50       |
| Content gap analysis    | 1         | 15-25 min      | $2-$3       |
| On-page optimization    | 1         | 20-30 min      | $2-$4       |
| Social distribution     | 1         | 10-15 min      | $1-$2       |
| Technical audit         | 1         | 15-25 min      | $2-$3       |
| Sprint summary          | 1 (lead)  | 5-10 min       | $0.50-$1    |
| **Total**               |           | **~50-75 min** | **~$8-$13** |

---

## Monthly Cadence

Recommended schedule for recurring sprints:

1. **Day 1-2:** Run GSC + GA4 manual sync to ensure fresh data
2. **Day 3:** Run SEO Growth Sprint team agent
3. **Day 4-5:** Human reviews all "review" status content in dashboard
4. **Day 6:** Approve and publish reviewed content
5. **Day 7+:** Social posts auto-publish per calendar schedule
6. **End of month:** Compare analytics to previous month baseline

Repeat monthly. Each sprint builds on the previous cycle's data, creating a compound growth effect.
