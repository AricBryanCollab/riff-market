# Unit Testing Strategy Brainstorm

**Date:** 2026-01-24

## What We're Building

Add jsdom-based unit tests alongside existing Vitest browser tests for testing utility functions and pure logic.

## Why This Approach

- **Speed:** jsdom tests run in ~10ms vs browser tests in ~100-500ms
- **Simplicity:** Pure functions need no mocking or browser context
- **Complementary:** Browser tests for components, unit tests for logic
- **YAGNI:** Start with utilities only—expand later if needed

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test targets | Utility functions only | Highest value-to-effort; stores tested via browser tests |
| Config approach | Separate `vitest.config.ts` | Simpler than workspaces, explicit separation |
| File location | Co-located (`*.test.ts`) | Easy to find, matches browser test pattern |
| Test naming | `*.test.ts` (unit) vs `*.browser.test.ts` | Clear distinction from browser tests |

## Implementation Outline

1. Create `vitest.config.ts` with jsdom environment
2. Create setup file `src/test/vitest.setup.ts`
3. Add `test:unit` script to package.json
4. Add example test for existing utility

## Open Questions

None—straightforward implementation.

## Next Steps

Run `/workflows:plan` to generate implementation plan.
