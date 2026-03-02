# Team Agent: MVP Build

## Setup Required
Enable Agent Teams in Claude Code settings:
```json
// settings.json
{
  "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": true
}
```

Recommended: Install tmux for split-pane visibility into each teammate's work.

---

## Team Composition: MVP Milestone

### Lead Agent (You interact with this one)
**Role:** Tech Lead / Orchestrator
**Responsibilities:**
- Reads `@docs/project_spec.md` MVP scope
- Creates shared task list with dependencies
- Spawns teammates with role-specific context
- Monitors progress via teammate messages
- Resolves merge conflicts between teammates
- Synthesizes final integration
- Runs retro-agent when complete

### Spawn Prompt
Use this prompt to kick off the MVP build:

```
I need to build the MVP milestone for Authority Engine according to @docs/project_spec.md.

Create an agent team with 4 teammates for parallel development:

**Teammate 1 — Database Engineer**
Role: Build the Supabase schema, migrations, RLS policies, and seed data.
Context: Read @docs/architecture.md for table definitions. Every table needs organization_id with RLS. Seed data for "Cleanest Painting LLC" org. Use Supabase MCP for direct database access.
Files: packages/db/
Deliver: Working migrations, RLS policies, seed script. Message Teammate 4 with the final TypeScript types for all tables.

**Teammate 2 — Auth & Middleware Engineer**  
Role: Build Supabase Auth flow (email + magic link), auth middleware, org scope middleware, protected API routes.
Context: Read CLAUDE.md for auth rules. JWT from Supabase Auth feeds RLS. Middleware must extract user_id → look up organization_id → inject into request context.
Files: app/api/auth/, lib/supabase.ts, middleware.ts
Deliver: Working auth flow. Message Teammate 3 when auth guards are ready so dashboard can use them.
Dependency: Wait for Teammate 1 to confirm schema includes users and organizations tables.

**Teammate 3 — Frontend Engineer**
Role: Build the dashboard shell — layout, sidebar nav, org context provider, auth guards, and page skeletons for all 5 modules.
Context: Read CLAUDE.md for frontend rules. Use Shadcn/ui components. Tailwind only. Server Components by default, 'use client' only when needed. Brand colors from org settings via CSS variables.
Files: app/(dashboard)/, components/ui/, hooks/, stores/
Deliver: Working dashboard with sidebar, org context, and placeholder pages. Message Lead when shell is ready for content generator integration.
Dependency: Wait for Teammate 2 to confirm auth guards are available.

**Teammate 4 — Shared Infrastructure Engineer**
Role: Build shared TypeScript types, Supabase client, AI service wrappers (Claude API), utility functions, and Zod validation schemas.
Context: Read CLAUDE.md for code style. Read packages/ai/CLAUDE.md for AI service rules. Types must match the database schema from Teammate 1.
Files: types/, lib/, packages/ai/, packages/shared/
Deliver: Exported types, configured Supabase client, Claude API wrapper with prompt templates for service pages, location pages, and blog posts.
Dependency: Wait for Teammate 1 to send table type definitions.

After all 4 teammates finish Phase 1, assign Phase 2:

**Teammate 1 (repurposed) — Content Generator Backend**
Role: Build API routes for content generation — POST /api/v1/content/generate, GET /api/v1/content, PATCH /api/v1/content/:id/approve. Wire up BullMQ for async generation.
Files: app/api/v1/content/, 
Dependency: Uses types from Teammate 4, DB from Teammate 1's own schema.

**Teammate 3 (repurposed) — Content Generator Frontend**
Role: Build the content generation UI — select content type, configure params, generate, review, edit, approve workflow.
Files: app/(dashboard)/content/, components/content/
Dependency: Uses API routes from Teammate 1, auth from Teammate 2, dashboard shell from own Phase 1 work.

**Teammate 2 (repurposed) — Public SSR Pages**
Role: Build Server Component routes for published content — /services/[slug], /locations/[slug], /blog/[slug]. SEO meta tags, structured data, sitemap.
Files: app/(marketing)/
Dependency: Uses published content from database.

After Phase 2 completes:
1. Run integration tests across all routes
2. Spawn retro-agent for quality review
3. Update docs/project_status.md and docs/changelog.md
4. Deploy preview via Vercel MCP
```

---

## Communication Protocol

Teammates should follow these messaging rules:

1. **Schema handoff:** Teammate 1 messages ALL teammates when schema is finalized, including TypeScript type definitions
2. **Auth ready signal:** Teammate 2 messages Teammate 3 when auth guards are exported and ready to import
3. **Blocker escalation:** Any teammate messages the Lead if blocked for more than 5 minutes
4. **File conflict prevention:** Before editing a shared file (like `lib/supabase.ts`), message the teammate who owns it and coordinate
5. **Completion signal:** Each teammate messages the Lead with a summary when their phase is done

---

## Git Worktree Strategy

Each teammate works on its own branch to avoid conflicts:

```bash
# Lead creates worktrees before spawning teammates
git worktree add ../ae-db feature/mvp-database
git worktree add ../ae-auth feature/mvp-auth
git worktree add ../ae-dashboard feature/mvp-dashboard
git worktree add ../ae-shared feature/mvp-shared-infra

# After Phase 1, merge all into feature/mvp
git checkout feature/mvp
git merge feature/mvp-database
git merge feature/mvp-auth
git merge feature/mvp-dashboard
git merge feature/mvp-shared-infra

# Phase 2 teammates continue on feature/mvp
```

---

## Cost Estimate

| Phase | Teammates | Est. Duration | Est. Cost |
|-------|-----------|---------------|-----------|
| Phase 1 (parallel) | 4 | 30-45 min | $4-$6 |
| Phase 2 (parallel) | 3 | 20-30 min | $3-$4 |
| Integration + QA | 1 (lead) | 15-20 min | $1-$2 |
| **Total** | | **~75 min** | **~$8-$12** |

vs. sequential single-session: ~3-4 hours, similar token cost but 3x slower.
