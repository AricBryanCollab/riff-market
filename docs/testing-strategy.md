# Testing Strategy
<!-- concept:def testing_strategy -->

This project should optimize for a small, high-signal test suite. Do not add tests just because code changed. Add tests when they protect behavior that would be expensive, risky, or confusing to break.

## Principle

Test behavior through public interfaces. Avoid tests that lock in implementation details.

A good test should answer at least one of these questions:

- Would this catch a money, inventory, permission, or data-integrity regression?
- Would this catch a user-visible break in a core flow?
- Would this document a business rule that future engineers are likely to misunderstand?
- Would this survive a refactor that keeps the same behavior?

If the answer is no, prefer not adding the test. If an existing test mostly verifies wiring, delegation, DTO shape, or a temporary compatibility layer, it is a candidate to merge into a higher-value test or delete when that path is removed.

## Preferred Test Shape

Use a small layered suite:

1. Browser smoke tests for core user flows.
2. DB-backed integration tests for risky persistence and authorization behavior.
3. Focused domain tests for dense business rules.
4. Narrow service tests only when they clarify request validation or error mapping that is not covered elsewhere.

Do not rely on browser or E2E tests alone. They prove the app is wired together, but they are slower, more brittle, and worse at locating the broken rule.

## Keep

Keep tests for:

- checkout and purchase creation
- atomic stock reservation and oversell prevention
- order and notification visibility scoped to the current user
- listing lifecycle and moderation status rules
- moderation status persistence plus notification creation in the same transaction
- seller-order status transitions
- money conversion and integer-cent behavior
- authenticated browser smoke for checkout, listing management, moderation, and notifications

These tests protect money, permissions, data integrity, and core user flows.

## Avoid Or Delete

Avoid adding, and delete opportunistically:

- route tests that only prove a route calls another helper
- action or repository tests for legacy paths after the path is drained
- tests that assert internal call order or collaborator call counts
- tests that mock modules owned by this repo instead of testing through the public interface
- tests that duplicate the same behavior already covered by a DB integration or browser smoke flow
- tests that mirror DTO shape without protecting behavior

Deleting low-value tests is part of keeping the suite maintainable.

## Default For New Work

Before adding tests, name the behavior in user or domain language. Then choose the smallest useful layer:

- Use a domain test for pure lifecycle, invariant, or value-object rules.
- Use a service or application test for authorization, validation, and use-case outcomes.
- Use a DB integration test for transactions, query semantics, persistence mapping, uniqueness, rollback, and concurrent stock behavior.
- Use a browser smoke test only for end-to-end confidence in a core user flow.

Add one behavior test at a time. Get it passing before adding the next one. Do not write a large batch of tests for imagined behavior before the implementation has taught us where the real risk is.

## Current Commands

- `bun run test:unit` runs the normal Vitest suite, with DB tests skipped by default.
- `bun run test:db` runs the gated Prisma integration suite and requires `RUN_DB_TESTS=1` plus a safe `TEST_DATABASE_URL`.
- `bun run test:browser` runs browser-level Vitest tests.
- `bun run typecheck` catches type-level regressions that should not need behavior tests.

Prefer focused commands while developing, then run the smallest broader suite that matches the risk of the change.
