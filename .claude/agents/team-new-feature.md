# Team Agent: New Feature Build

Use when adding a feature that spans multiple layers (frontend + backend + DB + tests).

---

## When to Use Team Agents vs Sub-Agents vs Single Session

| Scenario                                        | Use             |
| ----------------------------------------------- | --------------- |
| Single file fix or small change                 | Single session  |
| Focused task (write tests, update docs)         | Sub-agent       |
| Feature touching 2-3 files in same layer        | Single session  |
| Feature spanning frontend + backend + DB        | **Team Agents** |
| Feature needing research + competing approaches | **Team Agents** |
| Full milestone build                            | **Team Agents** |

---

## Generic Feature Team (3 Teammates)

### Spawn Prompt Template

```
I need to build [FEATURE NAME] for Authority Engine.

Requirements: [paste from project_spec.md or describe]

Create an agent team with 3 teammates:

**Teammate 1 — Backend**
Role: Build API routes, database migrations (if needed), service logic, and background jobs.
Context: Read CLAUDE.md and @docs/architecture.md. Use adapter pattern for integrations. Zod validation on all inputs. Background jobs via BullMQ for anything > 3 seconds.
Files: app/api/, packages/db/, lib/
Deliver: Working API endpoints with tests. Message Teammate 2 with the API contract (request/response shapes).

**Teammate 2 — Frontend**
Role: Build UI components, pages, hooks, and state management for this feature.
Context: Read CLAUDE.md. Shadcn/ui + Tailwind. Server Components by default. TanStack Query for data fetching. react-hook-form + Zod for forms.
Files: app/(dashboard)/[feature]/, components/[feature]/, hooks/
Deliver: Working UI integrated with API.
Dependency: Wait for Teammate 1 to share API contract.

**Teammate 3 — QA & Integration**
Role: Write tests for both backend and frontend. Run the full test suite. Check TypeScript strict mode. Verify multi-tenant isolation.
Context: Read CLAUDE.md for testing rules. Vitest + React Testing Library + MSW for API mocking.
Files: **/*.test.ts, **/*.test.tsx
Deliver: Full test coverage for the new feature. Report any bugs found to Teammate 1 or 2.
Dependency: Wait for Teammates 1 and 2 to finish implementation.

After all complete:
1. Lead merges and resolves any conflicts
2. Run full test suite
3. Spawn changelog-agent to update docs
4. Deploy preview via Vercel MCP
```

---

## Git Strategy

```bash
# Create feature branch and worktrees
git checkout -b feature/[name]
git worktree add ../ae-backend feature/[name]-backend
git worktree add ../ae-frontend feature/[name]-frontend

# QA teammate works on the main feature branch after merge
# Merge order: backend first, then frontend, then QA runs on merged code
```
