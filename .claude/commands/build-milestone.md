# Build Milestone

Execute a milestone build using the project spec. Uses parallel subagents where possible.

## Usage

`/build-milestone MVP` or `/build-milestone V1`

## Steps

1. **Read the milestone requirements:**
   - Open `@docs/project_spec.md` and find the matching milestone section
   - List every deliverable in the milestone scope

2. **Create an implementation plan:**
   - Break the milestone into independent work streams
   - Identify which streams can run in parallel (subagents)
   - Identify which streams have dependencies (must be sequential)
   - Write the plan to `.claude/plan-$ARGUMENTS.md`

3. **Execute with parallelization:**
   - Use `Task(...)` to spawn subagents for independent work streams
   - Example parallel streams for MVP:
     - Stream A: Database schema + migrations + seed data
     - Stream B: Auth flow + middleware + protected routes
     - Stream C: Dashboard shell + layout + sidebar navigation
   - Sequential after A+B+C complete:
     - Stream D: AI content generator (needs DB + auth + UI shell)
     - Stream E: Public SSR pages (needs content in DB)

4. **After each stream completes:**
   - Run typecheck + lint + tests
   - Spawn changelog-agent to update docs

5. **After all streams complete:**
   - Spawn retro-agent for quality review
   - Spawn frontend-test-agent for component test coverage
   - Run `/update-docs-and-commit`

6. **Update `docs/project_status.md`** with milestone completion status.
