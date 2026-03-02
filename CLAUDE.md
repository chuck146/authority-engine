# Authority Engine

## About
SEO & Growth Platform for home improvement companies.
Built by Cleanest Painting LLC / Rodas Consulting Group.
Multi-tenant SaaS — white-labeled via Rodas Consulting.

## Documentation
- @docs/project_spec.md — Full PRD with milestones (MVP → V1 → V2 → Later)
- @docs/architecture.md — System architecture, data flow, component relationships
- @docs/video-guidelines.md — Video generation tech stack (Remotion, Veo 3.1, Nano Banana 2)
- @docs/project_status.md — Milestone tracker with progress
- @docs/changelog.md — All notable changes

## Tech Stack
- **Framework:** Next.js 15 (App Router) + TypeScript strict mode
- **Styling:** Tailwind CSS + Shadcn/ui components
- **Database:** PostgreSQL via Supabase (RLS for multi-tenancy)
- **Auth:** Supabase Auth (email + magic link) — JWT feeds RLS policies
- **AI Text:** Claude API (Anthropic) — content generation, SEO analysis
- **AI Images:** Nano Banana 2 (Gemini 3.1 Flash Image) — graphics, thumbnails
- **AI Video:** Remotion (programmatic) + Veo 3.1 (cinematic)
- **Queue:** BullMQ + Redis — background jobs
- **Storage:** Supabase Storage + Cloudflare R2
- **Deployment:** Vercel (via Vercel MCP)
- **Email:** Resend

## Code Style
- ES modules (import/export), never CommonJS
- Functional components with hooks, never class components
- TypeScript strict mode — type hints on all functions
- Tailwind + Shadcn/ui for styling, no CSS modules
- Zod for runtime validation on all API inputs and form data
- Named exports for components, default export only for pages
- Server Components by default; add 'use client' only when needed

## Architecture Rules
- **Multi-tenant always.** Every table has `organization_id`. Every query scoped via RLS.
- **Adapter pattern for integrations.** Never hard-code HubSpot/Google/Slack in business logic.
- **AI services are stateless.** All context passed in request. No session state.
- **All AI content requires human review.** Nothing auto-publishes.
- **Background jobs for anything > 3 seconds.** BullMQ queues.
- **Server Components for SEO pages.** Service pages, location pages, blog posts use SSR.
- **Route Groups:** `(dashboard)` for authenticated app, `(marketing)` for public SEO pages.

## Git Workflow
- ALWAYS create a feature branch before starting major changes
- NEVER commit directly to `main`
- Branch naming: `feature/description` or `fix/description`
- Run typecheck + lint before committing
- Use `/update-docs-and-commit` slash command for doc updates

## Security
- ALWAYS use environment variables for secrets (see .env.example)
- Never commit .env files — only .env.example
- Supabase service role key: server-side only, never expose to client
- All API routes validate auth token before processing

## Common Commands
```bash
npm run dev          # Next.js dev server (frontend + API)
npm run dev:worker   # BullMQ background worker
npm run build        # Production build
npm run lint         # ESLint + Prettier
npm run typecheck    # TypeScript strict check
npm run test         # Vitest test suite
npm run db:migrate   # Run Supabase migrations
npm run db:seed      # Seed dev data (Cleanest Painting org)
npm run db:reset     # Reset and re-seed
```

## MCP Servers (Connected)
- **Supabase** — Direct database queries and schema management
- **Playwright** — Automated browser testing and QA
- **Vercel** — Deploy previews and production deployments
- **ClickUp** — Project management and task tracking
- **HubSpot** — CRM integration testing and data verification
- **n8n** — Workflow automation testing

## Project Structure
```
authority-engine/
├── app/                        # Next.js App Router
│   ├── (dashboard)/            # Authenticated app (SEO, Content, Reviews, etc.)
│   ├── (marketing)/            # Public SSR pages (service, location, blog)
│   ├── api/                    # API routes (Next.js Route Handlers)
│   └── layout.tsx              # Root layout with providers
├── components/                 # React components
│   ├── ui/                     # Shadcn/ui base components
│   ├── seo/                    # SEO module components
│   ├── content/                # Content engine components
│   ├── reviews/                # Review module components
│   └── community/              # Community module components
├── lib/                        # Utilities, Supabase client, AI wrappers
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand stores
├── types/                      # Shared TypeScript types
├── packages/
│   ├── db/                     # Supabase migrations + seed
│   └── ai/                     # AI service wrappers + prompt templates
├── services/
│   ├── seo/                    # SEO audit microservice (Python FastAPI)
│   └── video/                  # Remotion compositions
├── docs/                       # Project documentation
├── .claude/                    # Claude Code config
│   ├── commands/               # Slash commands
│   │   ├── new-feature.md      # /new-feature [name]
│   │   ├── build-milestone.md  # /build-milestone [MVP|V1|V2]
│   │   ├── run-tests.md        # /run-tests
│   │   └── update-docs-and-commit.md
│   ├── agents/                 # Sub-agents (single session)
│   │   ├── changelog-agent.md
│   │   ├── frontend-test-agent.md
│   │   └── retro-agent.md
│   ├── agents/                 # Team agents (multi-session, parallel)
│   │   ├── team-mvp-build.md       # Full MVP build with 4 teammates
│   │   ├── team-new-feature.md     # Generic 3-teammate feature build
│   │   ├── team-debug.md           # Competing hypothesis debugging
│   │   ├── team-code-review.md     # 4-reviewer pre-merge review
│   │   └── team-content-sprint.md  # Parallel content generation
│   └── hooks/
│       └── pre-push.md
└── .env.example                # Environment variable template
```

## Agent Strategy
- **Single session:** Small fixes, one-file changes, quick questions
- **Sub-agents:** Focused tasks (write tests, update docs, generate changelog)
- **Team Agents:** Multi-layer features, milestone builds, debugging, code review, content sprints
- Team Agents require: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=true` in settings.json
- Use git worktrees to prevent teammates from conflicting on same files

## Multi-Tenant Context (Dev)
- Default org: Cleanest Painting LLC
- Slug: `cleanest-painting`
- Colors: primary #1a472a, secondary #fbbf24, accent #1e3a5f
- HubSpot Portal: 21546007
- ClickUp Projects List: 901320531655
