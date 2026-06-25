# DDD Migration Progress

Clean slate started: 2026-06-11

## Source Of Truth

- Approved decision summary: `ddd/grill-me-summary.md`
- Approved migration plan: `ddd/migration-plan.md`
- Agent handoff protocol: `ddd/agent-handoff-protocol.md`
- Next-session handoff: `ddd/next-session.md`
- Class/function shape guidance: `ddd/class-vs-functions.md`

## Current Status

| Slice | Status |
| --- | --- |
| `-1` Characterization and risk tests | Complete. Customer order-read ownership gap was fixed; old fake-order schema details are not compatibility requirements. |
| `0` Foundation | Complete. Shared DDD folders, `Actor`, domain events, result/errors, unit-of-work boundary, and `Money` are in place. |
| `0.5` Money persistence | Complete for current migration bridge. `Product.priceCents` / `currencyCode` exist, product writes dual-write, reads prefer cents. |
| `1` Place Purchase | Complete for current path. Checkout goes through `placePurchaseFn` -> `PlacePurchase`, with real Prisma transaction, guarded stock, `Purchase`, `SellerOrder`, and same-transaction notifications. |
| `2` Purchase and SellerOrder lifecycle | Complete for active delivery. Order list/detail/status flows use TanStack server functions and target read/status modules; old `/api/orders` route family and fake order repo/action code are removed. |
| `3` Listing lifecycle | Complete for active listing commands. Create/update/delete/withdraw/moderate use listing server functions; decline retains `DECLINED`; referenced removal marks `WITHDRAWN`; old product command routes/actions/repos are removed. |
| `4` Listing queries/read models | Complete for current read delivery. Listing/product reads use listing read models and server functions; product read API routes and product query facade are removed. |
| `5` Notifications | Complete for current delivery. Notification read/create use cases and Prisma adapter exist; notification UI calls server functions; notification API routes/actions/repos are removed. |
| `6` Accounts | Complete for active account/profile/auth paths. Profile read/update/delete, profile-picture lifecycle, and sign-up/sign-in now go through account use cases/adapters; sessions remain delivery concerns. |
| `7` Reviews | Complete for active server-function behavior. Review domain/use cases, Prisma adapter, server functions, and gated DB coverage are in place. |
| `8` Media | Not started beyond existing cleanup worker/repo behavior. |
| `9` API route cleanup | Partially complete through migrated slices. Auth and upload image routes remain. |
| `10` Naming and polish | Not started. Product-to-listing persistence rename remains future work. |

## Current Slice 7 State

- Review DTOs, use cases, domain review validation, and Prisma adapter now live under `src/domains/reviews`.
- `Review` domain vocabulary uses `listingId`.
- `prisma/schema.prisma` exposes `Review.listingId @map("productId")`, keeping the existing physical database column and constraint names until the later Product-to-Listing persistence rename.
- `src/server/review-service.ts` composes review use cases over `PrismaListingReviews(prisma)`.
- `src/server/review.functions.ts` exposes `listListingReviewsFn` and `createListingReviewFn` for app delivery.
- `/api/reviews` has been deleted; do not reintroduce it without a concrete external HTTP compatibility requirement.
- Duplicate review creation maps to a typed `REVIEW_ALREADY_EXISTS` conflict result instead of leaking a Prisma error.
- Prisma unique-conflict error parsing now uses `src/domains/shared/infrastructure/prisma-errors.ts`.
- `src/actions/review.ts`, `src/data/review-repo.ts`, and `src/lib/zod/review-validation.ts` have been deleted; do not reintroduce review behavior there.
- `package.json` `test:db` now includes `src/domains/reviews/infrastructure/prisma-listing-reviews.prisma.test.ts`.
- Review application tests were developed with the TDD skill, one behavior at a time:
  - create and read reviews for a listing
  - reject ratings outside 1-5
  - reject a second review by the same user for the same listing
- Gated Prisma verification passed after running with sandbox escalation for local Postgres access.

## Current Verification

- `bun run db:generate` passed after the review Prisma schema mapping.
- Focused review unit run passed: `src/domains/reviews/domain/review.test.ts`, `src/domains/reviews/application/review-use-cases.test.ts`, and `src/server/review-service.test.ts`; the review Prisma test was collected and skipped without `RUN_DB_TESTS`.
- `bun run typecheck` passed with bundled Node on PATH.
- Touched-file Biome passed for review/server/package/tmp smoke files.
- Full non-DB `bun run test:unit` passed: 34 files passed, 8 DB files skipped, 214 tests passed and 41 skipped.
- `bun prisma validate --schema prisma/schema.prisma` passed.
- `bun run build` passed with the existing large client chunk warning and SSR connect-db chunk warning.
- `bun run docs:check` passed.
- `git diff --check` passed.
- Focused review Prisma test passed with `RUN_DB_TESTS=1` after sandbox escalation.
- Full gated `bun run test:db` passed with sandbox escalation: 8 DB files, 41 tests.

## Active Files And Boundaries

- Reviews boundary:
  - `src/domains/reviews/domain/review.ts`
  - `src/domains/reviews/dto/listing-review.ts`
  - `src/domains/reviews/application/review-use-cases.ts`
  - `src/domains/reviews/application/review-use-cases.test.ts`
  - `src/domains/reviews/domain/review.test.ts`
  - `src/domains/reviews/infrastructure/prisma-listing-reviews.ts`
  - `src/domains/reviews/infrastructure/prisma-listing-reviews.prisma.test.ts`
  - `src/domains/shared/infrastructure/prisma-errors.ts`
  - `src/server/review-service.ts`
  - `src/server/review-service.test.ts`
  - `src/server/review.functions.ts`
- Account profile boundary:
  - `src/domains/accounts/dto/account-profile.ts`
  - `src/domains/accounts/dto/account-profile-picture.ts`
  - `src/domains/accounts/dto/account-auth.ts`
  - `src/domains/accounts/application/account-profile.ts`
  - `src/domains/accounts/application/account-profile.test.ts`
  - `src/domains/accounts/application/account-profile-picture.ts`
  - `src/domains/accounts/application/account-profile-picture.test.ts`
  - `src/domains/accounts/application/account-auth.ts`
  - `src/domains/accounts/application/account-auth.test.ts`
  - `src/domains/accounts/infrastructure/profile-picture-assets.ts`
  - `src/domains/accounts/infrastructure/profile-picture-assets.test.ts`
  - `src/domains/accounts/infrastructure/prisma-account-auth.ts`
  - `src/domains/accounts/infrastructure/bcrypt-passwords.ts`
  - `src/server/account-service.ts`
  - `src/server/account-service.prisma.test.ts`
  - `src/server/account-auth-service.ts`
  - `src/server/account-auth-service.test.ts`
  - `src/server/account-auth-service.prisma.test.ts`
  - `src/server/current-user-service.ts`
  - `src/server/current-user-service.test.ts`
- Account auth delivery:
  - `src/routes/api/auth.signin.ts`
  - `src/routes/api/auth.signup.ts`
  - `src/routes/api/auth.signout.ts`
  - `src/data/auth-repo.ts`
- Prisma test harness:
  - `src/test/prisma-vitest-support.ts`
  - `src/test/prisma-test-data.ts`
  - `src/test/prisma-test-data.test.ts`
- Current DB test entrypoint:
  - `bun run test:db`

## Current Decisions

- Prefer plain functions for new simple application workflows and touched simple use cases.
- Keep classes for domain entities/value objects with behavior and infrastructure adapters with shared setup or client state.
- Do not churn older slices solely to convert one-method use-case classes; refactor them opportunistically when touching those slices.
- Keep session handling in delivery/server adapters, not account domain/application code.
- Keep Cloudinary, compression, `File`, `FormData`, Prisma JSON, React, TanStack, Zod, `Request`, and `Response` out of account domain/application code unless explicitly acting as an edge DTO/parser.
- Use account application `Result` contracts consistently across command branches; infrastructure persistence failures should not leak branch-specific exception behavior when the use case promises typed account errors.
- Treat database unique constraints as the registration invariant boundary; sign-up may avoid a pre-check, but the adapter must map duplicate-email writes to the account auth error result.
- Treat the review one-per-user/listing rule as a database-backed uniqueness invariant; the review adapter maps the unique constraint to `REVIEW_ALREADY_EXISTS`.
- Keep `productId` out of review domain/application/service/server-function vocabulary; use `listingId` and let Prisma `@map("productId")` bridge the old column until Slice `10`.
- Destructive DB tests require `RUN_DB_TESTS=1` and `TEST_DATABASE_URL`; do not use `DATABASE_URL` for this harness.
- `TEST_DATABASE_URL` must point to a disposable database whose name contains `test`, `testing`, `vitest`, or `integration`.
- Do not reintroduce removed `/api/products*`, `/api/orders*`, or `/api/notifications*` delivery paths without a concrete external HTTP compatibility requirement.

## Active Risks And Follow-Ups

- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Codex Desktop in-app browser local navigation still fails with `net::ERR_BLOCKED_BY_CLIENT`; standalone Playwright/system Chrome worked for local smoke.
- Existing non-fatal add-to-cart router warning from `navigate({ from: "/cart" })` remains.
- Existing non-fatal moderation navigation warning remains.
- Existing `ReviewSection` hydration mismatch from random rendered values remains observable during product detail browser smoke.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Exact Next Recommended Task

Begin Slice `8` Media from `ddd/migration-plan.md`:

1. Inspect existing media cleanup behavior and tests.
2. Add `MediaCleanupJob` domain/application boundary.
3. Preserve cleanup worker retry/lock/succeed/fail behavior.
4. Keep provider deletion in infrastructure.
5. Consider a small review server-function/browser smoke only if a real caller is added; current product detail review UI is still static placeholder content.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `8`
- `src/services/media-cleanup-worker.ts`
- `src/services/media-cleanup-targets.ts`
- `src/data/media-cleanup-job-repo.ts`
- `src/data/media-cleanup-job-data.ts`
- `src/services/media-cleanup-worker.test.ts`
- `src/domains/reviews/infrastructure/prisma-listing-reviews.prisma.test.ts`
