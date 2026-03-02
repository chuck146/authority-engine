# Team Agent: Content Sprint

Use to rapidly build out SEO content for a new tenant or new service area. Generates service pages, location pages, and blog posts in parallel.

This is Authority Engine's core value proposition running as a Team Agent workflow.

---

## When to Use

- Onboarding a new tenant (generate all initial content)
- Expanding into new service areas
- Launching content for a batch of new locations
- Weekly content production sprints

---

## Spawn Prompt Template

```
Run a content sprint for [ORG_NAME] to generate [CONTENT_TYPE].

Organization context:
- Services: [LIST e.g., Interior Painting, Exterior Painting, Cabinet Refinishing]
- Locations: [LIST e.g., Summit NJ, Westfield NJ, Cranford NJ, Short Hills NJ]
- Brand voice: [DESCRIPTION or "see org settings in database"]

Create an agent team with 3 content specialists:

**Teammate 1 — Service Page Writer**
Role: Generate SEO-optimized service pages using Claude API.
Instructions:
- Read packages/ai/prompts/content/service-page.ts for the prompt template
- Generate one page per service offered
- Each page must include: H1 with primary keyword, meta description, 800-1200 words, internal links to related services, CTA section
- Target keywords: "[service] [location]" pattern (e.g., "interior painting Summit NJ")
- Save to database with status "review"
- Use Supabase MCP to verify pages were saved correctly
Deliver: List of generated service pages with their slugs and target keywords. Message Teammate 3 with the slugs for internal linking.

**Teammate 2 — Location Page Writer**
Role: Generate SEO-optimized location pages using Claude API.
Instructions:
- Read packages/ai/prompts/content/location-page.ts for the prompt template
- Generate one page per town/city served
- Each page must include: town-specific content (neighborhoods, landmarks, housing styles), list of services available in that area, local testimonials placeholder, driving directions or area description
- Target keywords: "[service type] [town name] NJ" pattern
- Save to database with status "review"
- Use Supabase MCP to verify pages were saved correctly
Deliver: List of generated location pages. Message Teammate 3 with slugs.

**Teammate 3 — Blog & Internal Linking Strategist**
Role: Generate blog posts and build the internal linking structure across all content.
Instructions:
- Read packages/ai/prompts/content/blog-post.ts for the prompt template
- Generate 3-5 blog posts that naturally link to the service and location pages
- Topics should answer common customer questions (e.g., "How much does interior painting cost in NJ?", "Best exterior paint colors for Colonial homes")
- After Teammates 1 and 2 share their page slugs, create an internal linking map
- Update all pages with cross-links (service → location, location → service, blog → both)
- Save to database with status "review"
Deliver: Blog posts + internal linking report showing all cross-references.
Dependency: Wait for Teammates 1 and 2 to share page slugs before building link map.

After all complete:
1. Lead reviews content count and quality spot-check
2. Generate summary: X service pages, Y location pages, Z blog posts created
3. All content in "review" status — ready for human approval in dashboard
4. Update project_status.md with content count
```

---

## Expected Output

For a typical painting company (8 services × 12 towns):
- 8 service pages
- 12 location pages  
- 4-5 blog posts
- ~25 pieces of content in ~30 minutes

vs. manual writing: 2-3 weeks of agency work at $3K-$5K.
