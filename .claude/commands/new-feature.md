# New Feature Workflow

Start a new feature using the standard branch-plan-build workflow.

## Steps

1. Create a feature branch:

```bash
git checkout -b feature/$ARGUMENTS
```

2. Enter Plan Mode (Shift+Tab twice) and create an implementation plan:
   - Read `@docs/project_spec.md` for requirements
   - Read `@docs/architecture.md` for system design constraints
   - Identify all files that need to be created or modified
   - List dependencies and integration points
   - Estimate if subagents can parallelize any work

3. Write the plan to a temporary file:

```bash
# Save plan for reference during implementation
echo "plan content" > .claude/plan-$ARGUMENTS.md
```

4. Switch to Normal Mode and implement the plan step by step.

5. After implementation, run tests:

```bash
npm run typecheck
npm run lint
npm run test
```

6. Use `/update-docs-and-commit` to document and commit the work.
