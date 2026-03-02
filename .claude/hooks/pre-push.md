# Pre-Push Hook

Runs automatically before `git push` to catch issues early.

## What it does

Before any push to remote, this hook runs:

```bash
# 1. TypeScript strict check
npm run typecheck

# 2. ESLint + Prettier
npm run lint

# 3. Run tests (unit only for speed)
npm run test:unit
```

If any step fails, the push is blocked with a clear error message.

## Setup

Add to `.husky/pre-push`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-push checks..."

echo "📝 TypeScript check..."
npm run typecheck || { echo "❌ TypeScript errors found. Fix before pushing."; exit 1; }

echo "🧹 Lint check..."
npm run lint || { echo "❌ Lint errors found. Fix before pushing."; exit 1; }

echo "🧪 Running tests..."
npm run test:unit || { echo "❌ Tests failing. Fix before pushing."; exit 1; }

echo "✅ All checks passed. Pushing..."
```

## Dependencies
```bash
npm install -D husky
npx husky init
```
