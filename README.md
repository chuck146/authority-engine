# Authority Engine

**SEO & Growth Platform for Home Improvement Companies**

Built by Cleanest Painting LLC / Rodas Consulting Group

---

## PSB Framework: Plan → Setup → Build

This project follows the **PSB methodology** for AI-assisted development.

### Plan ✅
- [Project Spec](docs/project_spec.md) — Requirements, milestones (MVP → V1 → V2 → Later), tech design
- [Architecture](docs/architecture.md) — System design, data flow, component relationships
- [Video Guidelines](docs/video-guidelines.md) — AI video generation decision logic
- [Project Status](docs/project_status.md) — Milestone tracker with progress
- [Changelog](docs/changelog.md) — All notable changes

### Setup ✅
- **CLAUDE.md hierarchy** — Root + directory-specific context files
- **Git workflow** — Feature branches, never commit to main, pre-push hooks
- **.env.example** — All API keys documented
- **MCP Servers** — Supabase, Playwright, Vercel, ClickUp, HubSpot, n8n
- **Sub-agents** — Changelog, frontend testing, retro
- **Slash commands** — `/new-feature`, `/build-milestone`, `/run-tests`, `/update-docs-and-commit`

### Build
Start the MVP:
```
/build-milestone MVP
```
Or start a single feature:
```
/new-feature content-generator
```

---

## How CLAUDE.md Works

```
authority-engine/
├── CLAUDE.md                    ← ROOT: Loaded every session (~90 lines)
│                                   Tech stack, style, commands, @doc refs
├── docs/
│   ├── project_spec.md          ← Full PRD with milestones
│   ├── architecture.md          ← System design + data flow
│   ├── video-guidelines.md      ← Video gen decision logic
│   ├── project_status.md        ← What's done, what's next
│   └── changelog.md             ← All notable changes
├── packages/ai/
│   └── CLAUDE.md                ← AI services rules (models, prompts, temp)
├── .claude/
│   ├── commands/                ← Slash commands
│   │   ├── new-feature.md
│   │   ├── build-milestone.md
│   │   ├── run-tests.md
│   │   └── update-docs-and-commit.md
│   ├── agents/                  ← Sub-agents
│   │   ├── changelog-agent.md
│   │   ├── frontend-test-agent.md
│   │   └── retro-agent.md
│   └── hooks/
│       └── pre-push.md
└── .env.example                 ← All required API keys
```

Claude Code loads context hierarchically:
1. **Always:** Root `CLAUDE.md` (lean, ~90 lines)
2. **On demand:** `@docs/*` files when Claude needs specs or architecture
3. **By directory:** Nested `CLAUDE.md` files when working in specific packages

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 15 (App Router) | SSR for SEO pages, API routes built-in |
| Styling | Tailwind CSS + Shadcn/ui | Rapid UI development, consistent design |
| Database | Supabase (PostgreSQL) | RLS for multi-tenancy, built-in auth |
| Auth | Supabase Auth | JWT feeds RLS policies directly |
| AI Text | Claude API (Anthropic) | Content generation, SEO analysis |
| AI Images | Nano Banana 2 (Gemini) | Graphics, thumbnails, hero images |
| AI Video | Remotion + Veo 3.1 | Programmatic + cinematic video |
| Queue | BullMQ + Redis | Background job processing |
| Storage | Supabase Storage + R2 | Images + video files |
| Email | Resend | Transactional emails |
| Deploy | Vercel | Native Next.js hosting |

---

## MCP Servers (Claude Code)

| Server | Purpose |
|--------|---------|
| Supabase | Query database, manage schema directly from Claude Code |
| Playwright | Automated browser testing and QA |
| Vercel | Deploy previews and production from Claude Code |
| ClickUp | Task management and project tracking |
| HubSpot | CRM integration testing |
| n8n | Workflow automation testing |

---

## Quick Start

```bash
# Clone
git clone https://github.com/your-org/authority-engine.git
cd authority-engine

# Setup
cp .env.example .env.local   # Fill in API keys
npm install
npm run db:migrate
npm run db:seed

# Develop
npm run dev                   # Next.js dev server
npm run dev:worker            # BullMQ worker (separate terminal)

# Open Claude Code
claude
```

---

## Milestones

| Phase | Focus | Target |
|-------|-------|--------|
| 🟢 MVP | Auth + DB + AI Content Generator + SSR Pages | April 2026 |
| 🔵 V1 | SEO Scoring + Images + Content Calendar | June 2026 |
| 🟡 V2 | Reviews + Video + Community | September 2026 |
| 🟣 Later | White-Label Admin + Stripe + Advanced Analytics | TBD |

---

*Cleanest Painting LLC — "Where Artistry Meets Craftsmanship"*
*Rodas Consulting Group — Digital Transformation for Home Improvement*
