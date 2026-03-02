# Update Docs and Commit

After completing a feature or major change, update all project documentation and make a clean commit.

## Steps

1. Read the current `docs/changelog.md` and add an entry for today's changes under `[Unreleased]`:
   - Use categories: Added, Changed, Fixed, Removed
   - Be specific about what changed (file names, feature names)

2. Read `docs/project_status.md` and update:
   - Check off completed items
   - Add any new items discovered during development
   - Update progress percentages

3. If architecture changed (new tables, new services, new integrations), update `docs/architecture.md`

4. Run lint and typecheck:

```bash
npm run lint
npm run typecheck
```

5. Stage and commit with a descriptive message:

```bash
git add -A
git commit -m "docs: update changelog, project status, and architecture for [FEATURE]"
```

6. Push to current feature branch:

```bash
git push origin HEAD
```
