---
date: 2026-01-24
topic: vitest-browser-mode
---

# Vitest Browser-Mode Component Testing

## What We're Building
Add Vitest browser-mode component testing using Playwright + Testing Library. Tests will be co-located with source files and follow the Midday naming pattern, with a browser-specific suffix to enable clean separation later. We will add a dedicated `test:browser` script and a separate Vitest browser config so unit tests can be introduced later without refactors.

## Why This Approach
This keeps the initial setup focused on browser component tests while preserving flexibility for future unit tests. A dedicated browser config and suffix-based naming avoid mixing environments and make it easy to split `test:browser` and `test:unit` once unit tests are added.

## Key Decisions
- Use Playwright as the browser provider for Vitest browser mode.
- Use Testing Library for component testing ergonomics.
- Run Chromium only for now.
- Default to headless; allow headed runs via CLI option when needed.
- Co-locate tests with code using `*.browser.test.tsx` naming.
- Add a separate `vitest.browser.config.ts` and a `test:browser` script.

## Open Questions
- None for initial setup; add `test:unit` later.

## Next Steps
→ `/workflows:plan` for implementation details
