# Changelog — Authority Engine

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

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
- Test infrastructure: Vitest + React Testing Library, factories, mock Supabase client (141+ tests)
- Generated TypeScript types from live Supabase schema (replaced hand-written types/database.ts)
- Auto-link auth user to organization on first login (auth callback creates user_organizations record)
- Auth callback test suite (9 tests covering auto-linking, redirect sanitization, edge cases)

### Planned

- Deploy to Vercel
