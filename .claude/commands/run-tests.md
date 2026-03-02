# Run Tests

Run the full test suite with typecheck and lint.

## Steps

1. TypeScript check:
```bash
npm run typecheck
```

2. Lint:
```bash
npm run lint
```

3. Unit tests:
```bash
npm run test
```

4. If any tests fail:
   - Read the error output carefully
   - Fix the failing tests or the code they test
   - Re-run only the failing test file to verify the fix
   - Run the full suite one more time to confirm no regressions

5. Report results: list passing count, failing count, and any issues found.
