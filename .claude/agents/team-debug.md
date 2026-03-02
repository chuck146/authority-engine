# Team Agent: Debug Investigation

Use when a bug is complex and the root cause isn't obvious. Multiple teammates investigate different hypotheses in parallel, then debate to converge on the real cause.

---

## When to Use

- Bug reproduced but cause unknown
- Multiple possible root causes (auth issue? DB query? race condition? client state?)
- Bug that crosses layer boundaries (frontend + backend + database)
- Production issue that needs fast resolution

---

## Spawn Prompt Template

```
We have a bug in Authority Engine: [DESCRIBE THE BUG]

Steps to reproduce: [STEPS]
Expected behavior: [EXPECTED]
Actual behavior: [ACTUAL]

Create an agent team with 3 teammates to investigate competing hypotheses:

**Teammate 1 — Frontend Investigation**
Hypothesis: The bug originates in the client — state management, component rendering, or API call construction.
Instructions: 
- Use Playwright MCP to reproduce the bug in browser
- Check React component state, re-renders, and error boundaries
- Inspect network requests — are the right params being sent?
- Check console for client-side errors
- Document findings and message Teammate 2 and 3 with what you find

**Teammate 2 — Backend Investigation**
Hypothesis: The bug originates in the API — middleware, service logic, or database query.
Instructions:
- Trace the relevant API route end-to-end
- Check auth middleware — is org_id scoping correctly?
- Check database queries — are RLS policies filtering correctly?
- Use Supabase MCP to query the database directly and verify data state
- Check BullMQ job logs if background jobs are involved
- Document findings and message Teammate 1 and 3

**Teammate 3 — Data & Integration Investigation**
Hypothesis: The bug originates in data state or external integration.
Instructions:
- Use Supabase MCP to check the actual data in relevant tables
- Verify RLS policies are correct for the affected org
- Check if the bug is tenant-specific or affects all orgs
- Check external API responses (HubSpot, Google, etc.) if integrations are involved
- Document findings and message Teammate 1 and 2

**Critical Rule:** Teammates must actively try to DISPROVE each other's hypotheses. When Teammate 1 posts a finding, Teammates 2 and 3 should challenge it. The theory that survives debate is most likely the real cause.

After investigation (max 15 minutes):
1. Lead synthesizes all findings
2. Identify the root cause with highest confidence
3. Assign the fix to the most relevant teammate
4. Other teammates write regression tests
5. Update changelog
```
