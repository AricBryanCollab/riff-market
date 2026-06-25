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
| `6` Accounts | In progress. Account profile read/update/delete boundary exists; profile-picture lifecycle and sign-up/sign-in still need account use cases/adapters. |
| `7` Reviews | Not started. |
| `8` Media | Not started beyond existing cleanup worker/repo behavior. |
| `9` API route cleanup | Partially complete through migrated slices. Auth, reviews, and upload image routes remain. |
| `10` Naming and polish | Not started. Product-to-listing persistence rename remains future work. |

## Current Slice 6 State

- Account profile DTOs and application functions live under `src/domains/accounts`.
- Account profile read/update/delete use cases are plain functions, not one-method classes, following `ddd/class-vs-functions.md`.
- `src/server/account-service.ts` is the account service boundary for profile read/update/delete.
- `UserRepoAccountProfiles(db)` is the Prisma-backed account adapter and remains a class because it owns a Prisma client.
- `src/server/current-user-service.ts` routes current-user read/update/delete through the account service.
- `src/data/user-repo.ts` accepts injected DB clients for account-service integration tests and lazily loads the default Prisma client for production paths.
- `src/server/account-service.prisma.test.ts` covers account profile read/update/delete through real Prisma test data.
- The low-value mock-only `src/server/account-service.test.ts` was removed.
- Validation, profile-picture `FormData` parsing, and session clearing remain in server/delivery code.
- Profile-picture upload/update and sign-up/sign-in remain on existing paths for the next Slice `6` pass.

## Current Verification

- `bun run check -- src/data/user-repo.ts src/server/account-service.ts src/server/account-service.prisma.test.ts src/domains/accounts/application/account-profile.ts src/domains/accounts/application/account-profile.test.ts src/server/current-user-service.test.ts package.json` passed.
- `bun run typecheck` passed with bundled Node on PATH.
- Focused non-DB account/current-user Vitest run passed: 9 tests passed; account Prisma test skipped without `RUN_DB_TESTS`.
- `bun run test:db` passed: 6 DB files, 36 DB tests, including `src/server/account-service.prisma.test.ts`.
- `bun run docs:check` passed.

## Active Files And Boundaries

- Account profile boundary:
  - `src/domains/accounts/dto/account-profile.ts`
  - `src/domains/accounts/application/account-profile.ts`
  - `src/domains/accounts/application/account-profile.test.ts`
  - `src/server/account-service.ts`
  - `src/server/account-service.prisma.test.ts`
  - `src/server/current-user-service.ts`
  - `src/server/current-user-service.test.ts`
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
- Destructive DB tests require `RUN_DB_TESTS=1` and `TEST_DATABASE_URL`; do not use `DATABASE_URL` for this harness.
- `TEST_DATABASE_URL` must point to a disposable database whose name contains `test`, `testing`, `vitest`, or `integration`.
- Do not reintroduce removed `/api/products*`, `/api/orders*`, or `/api/notifications*` delivery paths without a concrete external HTTP compatibility requirement.

## Active Risks And Follow-Ups

- Continue Slice `6` by moving profile-picture lifecycle/upload behavior behind account application/infrastructure ports.
- Then migrate sign-up/sign-in behind account use cases while keeping session handling in delivery/server adapters.
- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Codex Desktop in-app browser local navigation still fails with `net::ERR_BLOCKED_BY_CLIENT`; standalone Playwright/system Chrome worked for local smoke.
- Existing non-fatal add-to-cart router warning from `navigate({ from: "/cart" })` remains.
- Existing non-fatal moderation navigation warning remains.
- Existing `ReviewSection` hydration mismatch from random rendered values remains observable during product detail browser smoke.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Exact Next Recommended Task

Continue Slice `6` Accounts:

1. Move profile-picture lifecycle/upload behavior behind account application/infrastructure ports.
2. Preserve current upload, replace, remove, cleanup-after-failure, and best-effort old-asset cleanup behavior.
3. Keep Cloudinary, compression, `File`, `FormData`, and Prisma JSON concerns out of account application/domain code.
4. After profile-picture behavior is moved, migrate sign-up/sign-in behind account use cases while keeping session handling in delivery/server adapters.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `6`
- `ddd/class-vs-functions.md`
- `src/actions/user.ts`
- `src/actions/profile-picture-lifecycle.ts`
- `src/actions/auth.ts`
- `src/data/user-repo.ts`
- `src/data/auth-repo.ts`
- `src/server/current-user-service.ts`
- `src/server/user.functions.ts`
- `src/hooks/use-update-profile-picture.ts`
- `src/hooks/use-auth-user.ts`
- `src/routes/api/auth.signin.ts`
- `src/routes/api/auth.signup.ts`
- `src/routes/api/auth.signout.ts`
