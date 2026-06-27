# DDD Migration Progress

Clean slate started: 2026-06-11

## Source Of Truth

- Approved decision summary: `ddd/grill-me-summary.md`
- Approved migration plan: `ddd/migration-plan.md`
- Agent handoff protocol: `ddd/agent-handoff-protocol.md`
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
| `8` Media | Complete. Media cleanup behavior, queue persistence, account/listing staging, and gated Prisma queue coverage are in place and verified. |
| `9` API route cleanup | Complete for current delivery. Auth sign-in/sign-up/sign-out moved to TanStack server functions; no `/api/*` routes remain under `src/routes/api`; obsolete auth API wrappers are removed. |
| `10` Naming and polish | In progress. First low-risk DTO naming cleanup moved listing form validation into the listings context; Product-to-Listing persistence rename remains future work. |

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

## Current Slice 8 State

- `MediaCleanupJob` domain behavior now lives in `src/domains/media/domain/media-cleanup-job.ts`.
- Retry delay, unsupported-target failure, final-attempt failure, exhausted-attempt error formatting, and bounded `lastError` formatting are covered by `src/domains/media/domain/media-cleanup-job.test.ts`.
- Batch orchestration now lives in `src/domains/media/application/run-media-cleanup-batch.ts`.
- Account-owned media cleanup staging now lives in `src/domains/media/application/stage-account-media-cleanup.ts`.
- Prisma account media cleanup staging now lives in `src/domains/media/infrastructure/prisma-account-media-cleanup-staging.ts`.
- Account deletion calls `stageAccountMediaForCleanup` before deleting the user in one transaction; `src/data/user-repo.ts` only owns user persistence.
- Cloudinary provider deletion now lives in `src/domains/media/infrastructure/cloudinary-media-cleanup-targets.ts`.
- Prisma cleanup-job claiming/marking now lives in `src/domains/media/infrastructure/prisma-media-cleanup-job-queue.ts` behind `MediaCleanupJobQueuePort`.
- Gated Prisma coverage for cleanup-job claiming/marking now lives in `src/domains/media/infrastructure/prisma-media-cleanup-job-queue.prisma.test.ts`.
- `package.json` `test:db` now uses `vitest.db.config.ts`, which includes all `src/**/*.prisma.test.ts` files.
- `src/data/media-cleanup-job-repo.ts` has been removed.
- `src/services/media-cleanup-worker.ts` remains as the compatibility entrypoint that wires logger, `PrismaMediaCleanupJobQueue`, and Cloudinary infrastructure.
- `src/services/media-cleanup-targets.ts` remains as a compatibility re-export.
- Listing image replacement and hard-delete cleanup now pass listing/seller source context and stage `PRODUCT` media cleanup rows via `stageListingMediaForCleanup` and `PrismaListingMediaCleanupStaging`.
- Newly uploaded listing images that fail before persistence still use immediate best-effort Cloudinary deletion because cleanup jobs require persisted source metadata.

## Current Slice 9 State

- Auth sign-in/sign-up/sign-out now use public TanStack server functions in `src/server/auth.functions.ts`.
- `signInFn` and `signUpFn` delegate account behavior to `signInAccountService` / `signUpAccountService`, then update `useAppSession` in the delivery adapter.
- `signOutFn` clears `useAppSession` in the delivery adapter.
- `src/server/account-auth-service.test.ts` now covers the local auth delivery/session boundary: successful auth updates `{ userId, role }` and returns the public auth response, while sign-out clears the session.
- Account auth services now accept parsed auth input, return `AccountAuthUser` directly, and throw `RequestError` for account auth failures instead of preserving the old API-style `{ success } | { error }` result wrapper.
- Sign-up role nullability is isolated to the sign-up hook form draft; server-facing sign-up request data uses a concrete role after validation/defaulting.
- Sign-in/sign-up server validation now uses Zod email validation after trimming, so malformed email strings are rejected at the delivery boundary.
- Account domain/application code still has no session, Request, Response, React, or TanStack dependency.
- `src/routes/api/auth.signin.ts`, `src/routes/api/auth.signup.ts`, and `src/routes/api/auth.signout.ts` have been deleted.
- No route files remain under `src/routes/api`.
- `src/lib/tanstack-query/auth-queries.ts` and `src/lib/tanstack-query/fetch.ts` have been deleted.
- Sign-in/sign-up/sign-out hooks call `src/server/auth.functions.ts` directly.
- Dead `AuthResponse` / `SignOutResponse` API wrapper types were removed from `src/types/auth.ts`.
- `src/routeTree.gen.ts` was regenerated by `bun run build` and no longer contains `/api/auth/*` routes.
- No upload image route remains under `src/routes/api`; listing image upload currently flows through listing server functions and listing/media infrastructure.

## Current Slice 10 State

- Initial inventory separated low-risk domain/client naming cleanup from higher-risk Prisma/database persistence rename work.
- Listing form validation DTOs now live in `src/domains/listings/dto/listing-form.ts`.
- `src/lib/zod/product-validation.ts` was removed.
- `src/server/listing-service.ts` now imports `createListingFormSchema` and `updateListingFormSchema` from the listings DTO module.
- `src/hooks/use-create-product.ts` and `src/hooks/use-update-product.ts` now use `CreateListingFormInput` / `UpdateListingFormInput` for listing server-function form payload typing.
- No Prisma `Product` model/client/table naming was changed in this step.
- Remaining low-risk naming surfaces include global `src/types/product.ts`, product-named listing read server-function compatibility names, product query hook/cache names, and product route/component naming.
- Larger persistence rename remains separate: `prisma/schema.prisma` still exposes `model Product`, `User.products`, `Favorite.productId`, legacy `OrderItem.productId`, generated Prisma `Product` types, and Prisma adapters using `db.product` / `Prisma.Product*`.

## Latest Verification

- Slice 10 touched-file Biome passed: `bun run check -- src/domains/listings/dto/listing-form.ts src/server/listing-service.ts src/hooks/use-create-product.ts src/hooks/use-update-product.ts`.
- Slice 10 focused listing-service test target collected and skipped without DB flags: `bun run test:unit -- src/server/listing-service.prisma.test.ts` -> 1 file skipped, 9 tests skipped.
- `bun run typecheck` passed after the listing form DTO move.
- Focused auth unit run passed: `bun run test:unit -- src/domains/accounts/application/account-auth.test.ts src/server/account-auth-service.test.ts src/server/account-auth-service.prisma.test.ts` -> 11 passed, 3 DB tests skipped.
- Touched-file Biome passed: `bun run check -- src/server/auth.functions.ts src/server/account-auth-service.ts src/server/account-auth-service.test.ts src/server/account-auth-service.prisma.test.ts src/hooks/use-sign-in.ts src/hooks/use-sign-up.ts src/hooks/use-sign-out.ts src/lib/zod/auth-validation.ts src/types/auth.ts src/routeTree.gen.ts ddd/progress.md`.
- `bun run typecheck` passed.
- Focused auth cleanup unit run passed: `bun run test:unit -- src/server/account-auth-service.test.ts src/server/account-auth-service.prisma.test.ts` -> 6 passed, 3 DB tests skipped.
- Focused auth cleanup Biome passed: `bun run check -- src/server/auth.functions.ts src/server/account-auth-service.ts src/server/account-auth-service.test.ts src/server/account-auth-service.prisma.test.ts src/hooks/use-sign-up.ts src/types/auth.ts`.
- `bun run typecheck` passed after auth cleanup changes.
- Focused auth email validation unit run passed: `bun run test:unit -- src/server/account-auth-service.test.ts src/server/account-auth-service.prisma.test.ts` -> 7 passed, 3 DB tests skipped.
- Focused auth email validation Biome passed: `bun run check -- src/lib/zod/auth-validation.ts src/server/account-auth-service.test.ts`.
- `bun run typecheck` passed after auth email validation changes.
- `git diff --check` passed.
- Boundary scan passed for account/shared domain code: `rg -n "@tanstack|React|Request|Response|useAppSession|session" src/domains/accounts src/domains/shared -g '!*.test.ts'` found no account domain/session-framework dependency; the only match was Prisma's own `PrismaClientKnownRequestError` type in shared infrastructure.
- Canonical `bun run test:db` passed with sandbox escalation against the local disposable Postgres test database: 9 DB files passed, 51 tests passed.
- `bun run build` passed with the existing large client chunk warning and SSR unused-import warnings.

## Previous Verification History

- Focused media unit run passed: `bun run test:unit -- src/domains/media/domain/media-cleanup-job.test.ts src/services/media-cleanup-worker.test.ts`.
- `bun run typecheck` passed after the media boundary extraction.
- Focused media/listing cleanup run passed with bundled Node on `PATH`: `bun run test:unit -- src/domains/media/domain/media-cleanup-job.test.ts src/domains/media/application/run-media-cleanup-batch.test.ts src/domains/media/application/stage-account-media-cleanup.test.ts src/domains/media/application/stage-listing-media-cleanup.test.ts src/domains/media/infrastructure/prisma-account-media-cleanup-staging.test.ts src/domains/media/infrastructure/prisma-listing-media-cleanup-staging.test.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/infrastructure/listing-image-assets.test.ts src/services/media-cleanup-worker.test.ts`.
- Full non-DB `bun run test:unit` passed with bundled Node on `PATH`: 40 files passed, 8 DB files skipped, 228 tests passed and 41 skipped.
- `bun run typecheck` passed with bundled Node on `PATH`.
- Touched-file `bun run check -- ...` passed for media cleanup, listing cleanup, worker, listing service files.
- `bun run build` passed with the existing large client chunk warning and SSR unused-import warnings.
- `bun run garden:lint` passed.
- `git diff --check` passed.
- `bun run db:generate` passed after the review Prisma schema mapping.
- Focused review unit run passed: `src/domains/reviews/domain/review.test.ts`, `src/domains/reviews/application/review-use-cases.test.ts`, and `src/server/review-service.test.ts`; the review Prisma test was collected and skipped without `RUN_DB_TESTS`.
- `bun run typecheck` passed with bundled Node on PATH.
- Touched-file Biome passed for review/server/package/tmp smoke files.
- Full non-DB `bun run test:unit` passed: 34 files passed, 8 DB files skipped, 214 tests passed and 41 skipped.
- `bun prisma validate --schema prisma/schema.prisma` passed.
- `bun run build` passed with the existing large client chunk warning and SSR connect-db chunk warning.
- `bun run garden:lint` passed.
- `git diff --check` passed.
- Focused review Prisma test passed with `RUN_DB_TESTS=1` after sandbox escalation.
- Full gated `bun run test:db` passed with sandbox escalation: 8 DB files, 41 tests.

## Active Files And Boundaries

- Media boundary:
  - `src/domains/media/domain/media-cleanup-job.ts`
  - `src/domains/media/domain/media-cleanup-job.test.ts`
  - `src/domains/media/application/run-media-cleanup-batch.ts`
  - `src/domains/media/application/stage-account-media-cleanup.ts`
  - `src/domains/media/application/stage-account-media-cleanup.test.ts`
  - `src/domains/media/application/stage-listing-media-cleanup.ts`
  - `src/domains/media/application/stage-listing-media-cleanup.test.ts`
  - `src/domains/media/infrastructure/cloudinary-media-cleanup-targets.ts`
  - `src/domains/media/infrastructure/prisma-account-media-cleanup-staging.ts`
  - `src/domains/media/infrastructure/prisma-account-media-cleanup-staging.test.ts`
  - `src/domains/media/infrastructure/prisma-listing-media-cleanup-staging.ts`
  - `src/domains/media/infrastructure/prisma-listing-media-cleanup-staging.test.ts`
  - `src/domains/media/infrastructure/prisma-media-cleanup-job-queue.ts`
  - `src/domains/media/infrastructure/prisma-media-cleanup-job-queue.prisma.test.ts`
  - `src/domains/listings/application/manage-listing.ts`
  - `src/domains/listings/application/manage-listing.test.ts`
  - `src/domains/listings/infrastructure/listing-image-assets.ts`
  - `src/domains/listings/infrastructure/listing-image-assets.test.ts`
  - `src/server/listing-service.ts`
  - `src/services/media-cleanup-worker.ts`
  - `src/services/media-cleanup-worker.test.ts`
  - `src/services/media-cleanup-targets.ts`
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
  - `src/server/auth.functions.ts`
  - `src/server/account-auth-service.ts`
  - `src/server/account-auth-service.test.ts`
  - `src/hooks/use-sign-in.ts`
  - `src/hooks/use-sign-up.ts`
  - `src/hooks/use-sign-out.ts`
  - `src/types/auth.ts`
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
- Auth sign-in/sign-up/sign-out use server-function delivery now that session update/clear is supported at the delivery edge; there is no remaining HTTP API route justification for these app-internal flows.
- Account auth server services receive typed, validated auth input from server-function validators; they do not repeat the same Zod parse and do not return API-style error envelopes.
- Keep Cloudinary, compression, `File`, `FormData`, Prisma JSON, React, TanStack, Zod, `Request`, and `Response` out of account domain/application code unless explicitly acting as an edge DTO/parser.
- Use account application `Result` contracts consistently across command branches; infrastructure persistence failures should not leak branch-specific exception behavior when the use case promises typed account errors.
- Treat database unique constraints as the registration invariant boundary; sign-up may avoid a pre-check, but the adapter must map duplicate-email writes to the account auth error result.
- Treat the review one-per-user/listing rule as a database-backed uniqueness invariant; the review adapter maps the unique constraint to `REVIEW_ALREADY_EXISTS`.
- Keep `productId` out of review domain/application/service/server-function vocabulary; use `listingId` and let Prisma `@map("productId")` bridge the old column until Slice `10`.
- Queue persisted listing image cleanup as media cleanup jobs with `PRODUCT` source metadata; keep direct best-effort deletion for uploaded images that were never persisted because `MediaCleanupJob` requires a concrete source row identity.
- Keep Product-to-Listing persistence rename separate from low-risk DTO/hook naming cleanup unless the session intentionally takes on the schema/generation slice.
- Destructive DB tests require `RUN_DB_TESTS=1` and `TEST_DATABASE_URL`; do not use `DATABASE_URL` for this harness.
- `TEST_DATABASE_URL` must point to a disposable database whose name contains `test`, `testing`, `vitest`, or `integration`.
- Do not reintroduce removed `/api/products*`, `/api/orders*`, `/api/notifications*`, or `/api/auth*` delivery paths without a concrete external HTTP compatibility requirement.

## Active Risks And Follow-Ups

- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Codex Desktop in-app browser local navigation still fails with `net::ERR_BLOCKED_BY_CLIENT`; standalone Playwright/system Chrome worked for local smoke.
- Existing non-fatal add-to-cart router warning from `navigate({ from: "/cart" })` remains.
- Existing non-fatal moderation navigation warning remains.
- Existing `ReviewSection` hydration mismatch from random rendered values remains observable during product detail browser smoke.
- Auth sign-in/sign-up/sign-out were verified through focused unit tests, typecheck, DB suite, and production build; browser smoke was not run in this session.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Exact Next Recommended Task

Continue Slice `10` Naming and Polish with another low-risk cleanup before the Prisma/schema rename.

Recommended next step:

1. Move the remaining read/query DTO types out of global `src/types/product.ts` into listings DTO modules, starting with `BaseProduct` -> a listing read DTO alias or replacement used by read hooks/components.
2. Keep cache key names, route paths, and component filenames unchanged until the DTO move compiles cleanly.
3. Keep Prisma/database persistence rename separate unless the session intentionally scopes the full schema/generation/migration work.
4. Before PR handoff, either run an auth browser smoke for sign-in/sign-up/sign-out or explicitly keep the current no-browser-smoke risk noted.
