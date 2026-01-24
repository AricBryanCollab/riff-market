---
title: Add jsdom Unit Tests
type: feat
date: 2026-01-24
---

# feat: Add jsdom Unit Tests

Add Vitest unit tests (jsdom environment) alongside existing browser tests for testing utility functions and pure logic.

## Overview

Currently, the project only has browser-mode tests (`*.browser.test.tsx`). This adds a faster jsdom-based test environment for pure functions and utilities.

**Why:** jsdom tests run ~10-50x faster than browser tests. Pure functions don't need real browser context.

## Acceptance Criteria

- [x] `vitest.config.ts` created with jsdom environment
- [x] `src/test/vitest.setup.ts` created
- [x] `test:unit` script added to package.json
- [x] Example test for `canModifyProduct.ts` utility
- [x] Unit tests run independently from browser tests

## Implementation

### 1. Create `vitest.config.ts`

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        include: ["src/**/*.test.{ts,tsx}"],
        exclude: ["src/**/*.browser.test.{ts,tsx}"],
        environment: "jsdom",
        setupFiles: ["src/test/vitest.setup.ts"],
    },
});
```

**Note:** Standalone config (not merged with vite.config) to avoid TanStack/Tailwind plugin overhead.

### 2. Create `src/test/vitest.setup.ts`

```ts
// src/test/vitest.setup.ts
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
    cleanup();
});
```

Minimal setup—just cleanup. Add matchers later if needed.

### 3. Add script to `package.json`

```json
{
    "scripts": {
        "test:unit": "vitest run --config vitest.config.ts"
    }
}
```

### 4. Create example test: `src/utils/canModifyProduct.test.ts`

```ts
// src/utils/canModifyProduct.test.ts
import { describe, it, expect } from "vitest";
import { canModifyProduct, isActionDisabled } from "./canModifyProduct";

describe("canModifyProduct", () => {
    it("returns true when user is seller", () => {
        const user = { id: "user-1", role: "seller" };
        expect(canModifyProduct(user, "user-1")).toBe(true);
    });

    it("returns false when user is not seller", () => {
        const user = { id: "user-1", role: "seller" };
        expect(canModifyProduct(user, "user-2")).toBe(false);
    });

    it("returns false when user is null", () => {
        expect(canModifyProduct(null, "user-1")).toBe(false);
    });
});

describe("isActionDisabled", () => {
    // TODO: User implements based on business logic understanding
});
```

## File Structure

```
vitest.config.ts          <- NEW (unit tests)
vitest.browser.config.ts  <- EXISTS (browser tests)
src/
  test/
    vitest.setup.ts       <- NEW (unit setup)
    vitest-browser.setup.ts <- EXISTS
  utils/
    canModifyProduct.ts
    canModifyProduct.test.ts <- NEW (example)
```

## Test Commands After Implementation

| Command | Purpose |
|---------|---------|
| `bun run test` | Existing default (unchanged) |
| `bun run test:unit` | Run jsdom unit tests |
| `bun run test:browser` | Run Playwright browser tests |

## Dependencies

No new dependencies—jsdom (`^27.0.0`) already installed.

## References

- Brainstorm: `docs/brainstorms/2026-01-24-unit-testing-brainstorm.md`
- Existing browser config: `vitest.browser.config.ts`
- Test target: `src/utils/canModifyProduct.ts`
