# Team Agent: Code Review

Use before merging a feature branch to main. Multiple reviewers check different quality dimensions in parallel.

---

## When to Use

- Before any merge to main
- After completing a milestone
- Before production deployments
- After significant refactors

---

## Spawn Prompt Template

```
Review the feature branch [BRANCH_NAME] before merging to main.

Diff: run `git diff main...[BRANCH_NAME]`

Create an agent team with 4 specialized reviewers:

**Teammate 1 — Security Reviewer**
Focus: Authentication, authorization, data exposure, injection risks.
Checklist:
- Are all new API routes behind auth middleware?
- Do new database tables have RLS policies with organization_id?
- Are there any hardcoded secrets or tokens?
- Is user input validated with Zod before use?
- Can any endpoint return data from another tenant?
- Are error messages leaking internal details?
Deliver: Security report with PASS/FAIL per check. Flag any blockers.

**Teammate 2 — Architecture Reviewer**
Focus: Code organization, patterns, scalability, multi-tenancy.
Checklist:
- Does new code follow the adapter pattern for integrations?
- Are Server Components used where appropriate (not unnecessary 'use client')?
- Is business logic in services, not in API route handlers?
- Do new components follow the project's component patterns?
- Are shared types in types/ and not duplicated?
- Is the code multi-tenant by default?
Deliver: Architecture report with recommendations.

**Teammate 3 — Performance Reviewer**
Focus: Database queries, bundle size, rendering efficiency.
Checklist:
- Any N+1 query patterns?
- Are database queries using indexes effectively?
- Are large lists paginated?
- Is there unnecessary client-side JavaScript that could be Server Components?
- Are images optimized (next/image)?
- Missing loading.tsx files for route segments?
Deliver: Performance report with specific file:line references.

**Teammate 4 — Test Coverage Reviewer**
Focus: Test quality and coverage for new code.
Checklist:
- Do new API routes have integration tests?
- Do new components have render + interaction tests?
- Are edge cases covered (empty state, error state, loading state)?
- Are multi-tenant scenarios tested (verify org isolation)?
- Run the test suite: `npm run test`
- Run typecheck: `npm run typecheck`
Deliver: Test report with coverage gaps and any failing tests.

After all reviewers finish:
1. Lead synthesizes all reports
2. Categorize findings: 🚨 Blockers (must fix), ⚠️ Suggestions (should fix), ✅ Good (no action)
3. If blockers exist, assign fixes before merge
4. If clean, approve merge to main
```
