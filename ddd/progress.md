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
| `7` Reviews | Not started. Next recommended slice. |
| `8` Media | Not started beyond existing cleanup worker/repo behavior. |
| `9` API route cleanup | Partially complete through migrated slices. Auth, reviews, and upload image routes remain. |
| `10` Naming and polish | Not started. Product-to-listing persistence rename remains future work. |

## Current Slice 6 State

- Account profile DTOs and application functions live under `src/domains/accounts`.
- Account profile read/update/delete use cases are plain functions, not one-method classes, following `ddd/class-vs-functions.md`.
- Account profile-picture DTOs and application functions live under `src/domains/accounts`.
- Account sign-up/sign-in DTOs and application functions live under `src/domains/accounts`.
- `src/server/account-service.ts` is the account service boundary for profile read/update/delete and profile-picture update/remove.
- `src/server/account-auth-service.ts` is the account service boundary for sign-up/sign-in.
- `UserRepoAccountProfiles(db)` is the Prisma-backed profile/profile-picture adapter and remains a class because it owns a Prisma client.
- `PrismaAccountAuth(db)` is the Prisma-backed sign-up/sign-in adapter and remains a class because it owns a Prisma client.
- `src/data/user-repo.ts` accepts injected DB clients for account-service integration tests and lazily loads the default Prisma client for production paths.
- `src/data/auth-repo.ts` now only keeps the `findUserById` helper used by auth middleware.
- Profile-picture upload/compression/delete is behind `CloudinaryProfilePictureAssets`; `src/server/account-service.ts` lazy-loads that adapter so unrelated account service imports do not eagerly read Cloudinary server env.
- `src/server/current-user-service.ts` routes current-user read/update/delete/profile-picture paths through account services.
- Auth sign-in/sign-up routes call account auth services and update session in route delivery code; sign-out remains route delivery/session clearing.
- Account sign-up duplicate-email handling is enforced at the `AccountRegistrationPort` result boundary; `PrismaAccountAuth` maps Prisma unique-email conflicts to `User already exists`, including the Prisma 7 driver-adapter error shape.
- Profile-picture update/remove now use one shared persistence/error-mapping path, so remove and replace return the same account-service error shape on persistence failures.
- `bcryptAccountPasswords` is a plain password adapter object, not a stateless one-method class.
- `src/actions/user.ts`, `src/actions/user.test.ts`, `src/actions/profile-picture-lifecycle.ts`, and `src/actions/auth.ts` have been deleted; do not reintroduce account behavior there.
- `src/server/account-service.prisma.test.ts` covers account profile read/update/delete through real Prisma test data.
- `src/server/account-auth-service.prisma.test.ts` covers sign-up/sign-in through real Prisma test data.
- The low-value mock-only `src/server/account-service.test.ts` was removed.
- Validation, profile-picture `FormData` parsing, and session handling remain in server/delivery code.
- Slice `6` is complete for active behavior; future account work should be driven by new product requirements rather than old action compatibility.

## Current Verification

- Focused account/auth/current-user Vitest run passed: 22 non-DB tests passed and the account auth Prisma test skipped without `RUN_DB_TESTS`.
- `bun run check -- <touched account/auth files> package.json` passed with bundled Node on PATH.
- `bun run typecheck` passed with bundled Node on PATH.
- Full non-DB `bun run test:unit` passed after thermo-nuclear review fixes: 31 files passed, 7 DB files skipped, 206 tests passed and 39 skipped.
- Gated `bun run test:db` passed after thermo-nuclear review fixes: 7 DB files, 39 DB tests, including `src/server/account-service.prisma.test.ts` and `src/server/account-auth-service.prisma.test.ts`.
- `bun run build` passed with the existing large client chunk warning.
- `bun run docs:check` passed.
- `git diff --check` passed.
- A `gpt-5.5` `xhigh` thermo-nuclear code-quality sub-agent follow-up review found no remaining high-conviction structural blockers after fixes.

## Active Files And Boundaries

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

Begin Slice `7` Reviews from `ddd/migration-plan.md`:

1. Inspect current review behavior and tests.
2. Add review DTO/application/domain boundary under `src/domains/reviews`.
3. Preserve current review creation/query behavior while moving business rules out of routes/actions/data helpers.
4. Keep authenticated-user checks and one-review-per-user/listing behavior explicit.
5. Use listing vocabulary in the review domain even if UI compatibility still says product.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `7`
- `ddd/class-vs-functions.md`
- `src/routes/api/reviews.ts`
- `src/data/review-repo.ts`
- `src/components/review-section.tsx`
- `src/types/review.ts`
- `src/domains/reviews`
