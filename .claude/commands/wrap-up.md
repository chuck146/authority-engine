# Wrap Up

After completing a discrete feature, fix, or phase — commit the work, update docs, and suggest what to tackle next.

## Steps

1. **Review what changed** — run `git status` and `git diff` to understand all uncommitted work

2. **Commit the work** — stage and commit with a descriptive message scoped to the completed task:
   - Summarize the nature of the change (feature, fix, refactor, etc.)
   - Keep the commit message concise (1-2 sentences)
   - If changes span multiple unrelated features, create separate commits for each

3. **Update `docs/changelog.md`** — add an entry under `[Unreleased]`:
   - Use categories: Added, Changed, Fixed, Removed
   - Be specific about what changed (file names, feature names)

4. **Update `docs/project_status.md`**:
   - Check off completed items
   - Add any new items discovered during development
   - Update progress percentages and "What's Next" section

5. **Update `docs/project_spec.md`** — only if milestone scope changed

6. **If architecture changed** (new tables, services, integrations), update `docs/architecture.md`

7. **Run lint and typecheck:**

   ```bash
   npm run lint
   npm run typecheck
   ```

8. **Commit the doc updates:**

   ```bash
   git add docs/
   git commit -m "docs: update project status and changelog for [FEATURE]"
   ```

9. **Suggest what to do next** — read the updated `docs/project_status.md` and `docs/project_spec.md`, then recommend the next logical task(s) based on incomplete items and milestone priorities
