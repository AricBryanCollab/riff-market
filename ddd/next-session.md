# Next Session Handoff

## Start Here

Required read order for every session:

1. `ddd/agent-handoff-protocol.md`
2. `ddd/next-session.md`
3. `ddd/migration-plan.md`
4. `ddd/grill-me-summary.md`
5. `ddd/progress.md`

Then inspect actual repo state:

- `git status --short`
- relevant source files and tests for checkout, orders, listings/products, moderation, and shared test setup

Do not rely on any manually maintained current-state file. The repo is the current state.

## Recommended Next Task

Continue Slice `1` verification, then start Slice `2` if checkout smoke is clean.

Exact next task:

- Smoke-test checkout through `usePlaceOrder` -> `createOrder` -> `placePurchaseFn` -> `PlacePurchase`.
- Verify the checkout still shows the existing success/error UX and clears the cart after success.
- Keep old cart details reads and order read APIs as compatibility for now.
- If smoke is clean, start Slice `2`: purchase/seller-order lifecycle and read-model migration.
- First Slice `2` target should be secure buyer purchase history and seller-order dashboard reads backed by `Purchase` / `SellerOrder`, while leaving legacy order reads only as temporary compatibility.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `1`
- `src/domains/listings/domain/listing.ts`
- `src/domains/ordering/domain/purchase.ts`
- `src/domains/ordering/domain/seller-order.ts`
- `src/domains/ordering/application/place-purchase.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `src/domains/ordering/infrastructure/prisma-listings-for-purchase.ts`
- `src/domains/shared/domain/money.ts`
- `src/domains/shared/application/unit-of-work.ts`
- `src/domains/shared/infrastructure/prisma-unit-of-work.ts`
- `src/server/function-middleware.ts`
- `src/server/order.functions.ts`
- `src/server/place-purchase-service.ts`
- `src/server/user.functions.ts`
- `src/hooks/use-place-order.ts`
- `src/lib/tanstack-query/orders-queries.ts`
- `src/actions/order.ts`
- `src/data/order.repo.ts`
- `src/data/product-repo.ts`
- `src/types/order.ts`
- `src/lib/zod/order-validation.ts`
- `prisma/schema.prisma`

## Do Not Start With

- Do not reopen approved architecture decisions unless implementation reveals a concrete contradiction.
- Do not start by rewriting all routes.
- Do not start by migrating all API reads.
- Do not preserve old fake order persistence behavior.
- Do not implement `Purchase` / `SellerOrder` before the foundation/unit-of-work and money primitives are in place.
- Do not implement `Purchase` / `SellerOrder` before money persistence has an integer-cent path for new DDD code.
- Domain code must not import React, TanStack, Prisma, Zod, Request, Response, FormData, or Cloudinary.
- Server functions are delivery adapters only.
- Use cases receive an explicit `Actor`.
- Repositories persist and map data; they do not orchestrate workflows.
- Money uses integer cents in the target model.

## Current Repo State From Latest Completed Session

- Latest implementation session completed on 2026-06-12:
  - work completed: checkout delivery wiring to the DB-backed `PlacePurchase` path
  - files changed: new place-purchase DTO, Prisma composition factory, server delivery helper/test, `placePurchaseFn`, `createOrder` mutation wrapper, shared Prisma unit-of-work type export, DB integration test factory use, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused delivery/use-case/creator tests passed; typecheck passed; full unit suite passed with DB file skipped by default; touched-file Biome passed; gated DB integration test passed with `RUN_DB_TESTS=1` after sandbox escalation for localhost DB access; production build passed; docs check passed
  - decisions made: preserve checkout UX and `createOrder` mutation naming while changing the mutation implementation to `placePurchaseFn`; keep payment-method selection as DTO validation only; keep Prisma singleton access lazy in the delivery helper
  - blockers or risks: no browser/manual checkout smoke test was run; legacy order read APIs and old `/api/orders` POST remain until follow-up cleanup; seller status authorization characterization remains expected-failing
  - exact next recommended task: smoke-test checkout through the new server-function path, then start Slice `2` read/lifecycle migration
- Latest implementation session completed on 2026-06-11:
  - work completed: notification boundary/UI moved to target purchase/seller-order IDs
  - files changed: notification DTO/repo, notification full page and dropdown UI, new notification display helper, old fake order notification payloads, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: typecheck passed; touched-file Biome passed; docs check passed
  - decisions made: notification API/UI no longer treats legacy `orderId` as the boundary or classification field; seller-order notifications take precedence over purchase notifications when both IDs are present
  - blockers or risks: old fake order creation can still create generic notifications until checkout delivery is rewired to `PlacePurchase`
  - exact next recommended task: add `placePurchaseFn` delivery wiring and update checkout/order mutation compatibility to call the new `PlacePurchase` path
- Latest implementation session completed on 2026-06-11:
  - work completed: notification creation event-contract hardening for the DB-backed `PlacePurchase` path
  - files changed: `src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.ts`, new creator unit test, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: typecheck passed; focused `PlacePurchase` and creator tests passed; DB integration test passed with `RUN_DB_TESTS=1`; touched-file Biome passed
  - decisions made: `PrismaPurchasePlacedNotificationCreator` now requires and validates `PurchasePlaced` and `SellerOrderCreated` events, while keeping aggregate state available for display details and consistency checks
  - blockers or risks: new path is still not wired to server function or checkout UI
  - exact next recommended task: add `placePurchaseFn` delivery wiring and update checkout/order mutation compatibility to call the new `PlacePurchase` path
- Latest implementation session completed on 2026-06-11:
  - work completed: account-deletion-safe target purchase/seller-order history hardening
  - files changed: `prisma/schema.prisma`, new migration `20260611110000_account_deletion_safe_purchase_history`, purchase/seller-order Prisma persistence adapters, `place-purchase.prisma.test.ts`, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: Prisma validate/generate passed; new migration applied to local Postgres; typecheck passed; focused domain/application tests passed; DB integration test passed with `RUN_DB_TESTS=1`; touched-file Biome passed
  - decisions made: target `Purchase.customerId` and `SellerOrder.sellerId` are nullable live `User` FKs using `ON DELETE SET NULL`; immutable `customerIdSnapshot` and `sellerIdSnapshot` preserve original buyer/seller IDs
  - blockers or risks: new path is still not wired to server function or checkout UI; localhost DB tests may require sandbox escalation
  - exact next recommended task: add `placePurchaseFn` delivery wiring and update checkout/order mutation compatibility to call the new `PlacePurchase` path
- Latest implementation session completed on 2026-06-11:
  - work completed: product money migration verified on local Postgres, target purchase/seller-order Prisma schema and migration, Prisma unit-of-work/adapters, guarded stock DB integration tests
  - files changed: `prisma/schema.prisma`, new purchase/seller-order migration, new ordering/shared infrastructure files, new `place-purchase.prisma.test.ts`, existing Slice `1` domain/application files, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: Prisma migrate deploy/status/validate/generate passed; DB integration test passed with `RUN_DB_TESTS=1`; full unit suite passed with DB tests skipped by default; typecheck passed; touched-file Biome passed
  - decisions made: keep legacy `Order` compatibility tables; keep seller-order item `listingId` as snapshot string without Product FK; gate DB tests behind `RUN_DB_TESTS=1`
  - blockers or risks: new path is not wired to server function or checkout UI yet; Docker/Postgres must be available for DB integration tests
  - exact next recommended task: add `placePurchaseFn` delivery wiring and update checkout/order mutation compatibility to call the new `PlacePurchase` path
- Local DB verification state:
  - Docker Desktop was started.
  - Container `riff-ddd-postgres` was started from local image `postgres:16`.
  - `postgresql://user:pass@localhost:5432/riff` has all seven migrations applied.
  - `Product.priceCents`, `Product.currencyCode`, and `Product_priceCents_idx` were verified in the real DB.
- Target persistence now exists:
  - `Purchase`
  - `Purchase.customerIdSnapshot` with nullable live `customerId`
  - `SellerOrder`
  - `SellerOrder.sellerIdSnapshot` with nullable live `sellerId`
  - `SellerOrderItem`
  - notification `purchaseId` / `sellerOrderId` links
- Notification DTO/API/UI now classify ordering notifications using `sellerOrderId` and `purchaseId`, not legacy `orderId`.
- Prisma adapters now exist for the current `PlacePurchase` port contracts.
- `PrismaPurchasePlacedNotificationCreator` now consumes domain events and fails if required purchase/seller-order events are missing or inconsistent.
- `PrismaListingsForPurchase.reserveForPurchase(...)` performs duplicate aggregation and atomic guarded stock decrement using `stock >= quantity`.
- DB integration tests prove successful persistence, rollback after late notification creation failure, and concurrent oversell prevention.
- Latest implementation session completed on 2026-06-11:
  - work completed: Slice `1` domain models and fake-port `PlacePurchase` application contract
  - files changed: `src/domains/shared/domain/domain-event.ts`, new listing/ordering domain and application files/tests, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused new tests passed, `bun run typecheck` passed, touched-file Biome passed, full `bun run test:unit` passed, `bun run docs:check` passed
  - decisions made: no approved architecture decisions changed; `buyerPhone` is nullable to match current user settings; `SellerOrderCreated` is emitted for notification creation
  - blockers or risks: local Postgres was not running on `localhost:5432`, so product money migration verification remains blocked
  - exact next recommended task: get a real local DB reachable, verify/apply product money migration, then add Prisma schema/adapters and guarded stock integration tests for `PlacePurchase`
- Minimal `Listing`, `Purchase`, and `SellerOrder` domain behavior exists and is covered by unit tests.
- `PlacePurchase` exists with fake-port tests and first application port contracts.
- `PlacePurchase` validates required buyer snapshot fields before opening a transaction.
- `SellerOrder` keeps item snapshots as defensive immutable copies.
- Existing checkout now calls `usePlaceOrder` -> `createOrder` -> `placePurchaseFn` -> `PlacePurchase`.
- Legacy `src/data/order.repo.ts` still orchestrates old fake order creation, stock decrement, and generic notification creation for the `/api/orders` POST compatibility path only.
- Slice `-1`, Slice `0`, and Slice `0.5` initial implementation are complete.
- The Slice `-1` customer order-by-id ownership characterization gap is fixed:
  - `getOrderByIdService` now receives authenticated `userId`.
  - `/api/orders/$id` GET passes `context.id` into the service.
  - `src/actions/order.test.ts` proves customers can read their own order and cannot read another customer's order.
- `src/actions/order.test.ts` still contains one expected-failing security characterization test:
  - seller order-status ownership gap
- DDD foundation folders exist under `src/domains`.
- Shared primitives exist under `src/domains/shared`.
- `Money` tests pass.
- `src/test/api-products-id-route.test.ts` was adjusted to serialize the form body for Node `Request` compatibility.
- Transitional product money persistence exists:
  - `Product.priceCents`
  - `Product.currencyCode`
  - deterministic Float-to-cent backfill migration
  - product create/update dual-write
  - product reads prefer cents and fall back to legacy Float only when cents are absent
  - approved product price filters parse to cents and query with Float fallback

Latest checks:

- `bun run typecheck` passed.
- `bunx biome check src/types/notification.ts src/data/notification-repo.ts src/data/order.repo.ts src/routes/notifications.tsx src/components/notification-list.tsx src/components/notification-display.tsx` passed.
- `bun run docs:check` passed.
- `bun run typecheck` passed.
- `bun run test:unit -- src/domains/ordering/application/place-purchase.test.ts src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts` passed: 2 files, 13 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed: 1 file, 4 tests.
- `bunx biome check src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.ts src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts src/domains/ordering/application/place-purchase.test.ts` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate deploy` passed for `20260611110000_account_deletion_safe_purchase_history`.
- `bun run typecheck` passed.
- `bun run test:unit -- src/domains/listings/domain/listing.test.ts src/domains/ordering/domain/purchase.test.ts src/domains/ordering/domain/seller-order.test.ts src/domains/ordering/application/place-purchase.test.ts` passed: 4 files, 29 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed: 1 file, 4 tests.
- `bunx biome check prisma/schema.prisma src/domains/ordering/infrastructure/prisma-purchase-persistence.ts src/domains/ordering/infrastructure/prisma-seller-order-persistence.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate deploy` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` passed: database schema is up to date.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed: 1 file, 3 tests.
- `bun run test:unit` passed: 16 files, 155 tests; 1 DB integration file skipped by default.
- `bun run typecheck` passed.
- `bunx biome check <touched schema/domain/application/infrastructure files>` passed.
- `bun run test:unit -- src/domains/listings/domain/listing.test.ts src/domains/ordering/domain/purchase.test.ts src/domains/ordering/domain/seller-order.test.ts src/domains/ordering/application/place-purchase.test.ts` passed: 4 files, 29 tests.
- `bun run typecheck` passed.
- `bunx biome check <touched domain/application files>` passed.
- `bun run test:unit` passed: 16 files, 155 tests.
- `bun run docs:check` passed.
- `bun run test:unit -- src/domains/listings/application/product-money.test.ts` passed: 1 file, 9 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.
- `bun run test:unit -- src/domains/listings/application/product-money.test.ts src/actions/product.test.ts src/domains/shared/domain/money.test.ts src/actions/order.test.ts` passed: 4 files, 82 tests.
- `bun run typecheck` passed.
- `bunx biome check <touched implementation files>` passed.
- `bun run docs:check` passed.
- `bun run test:unit` passed: 12 files, 126 tests.
- `bun run test:unit -- src/actions/order.test.ts` passed.
- `bun run typecheck` passed.
- `bunx biome check src/actions/order.ts src/actions/order.test.ts 'src/routes/api/orders.$id.ts'` passed.
- `bun run test:unit -- src/domains/shared/domain/money.test.ts src/actions/order.test.ts` passed.
- `bun run test:unit` passed.
- `bunx biome check <touched files>` passed.
- Full `bun run check` still reports unrelated pre-existing formatting issues outside the touched files.

## Expected End State For Next Session

- Checkout has been smoke-tested through the server-function `PlacePurchase` path.
- Existing checkout UX still places a purchase successfully for customers and shows useful errors for expected placement failures.
- Slice `2` has either started with purchase/seller-order read models, or there is a documented blocker from checkout smoke verification.
- Old order read APIs remain in place until purchase/seller-order read models are migrated.
- `ddd/progress.md` updated with:
  - work completed
  - files changed
  - tests/checks run and results
  - decisions made
  - blockers or risks
- `ddd/next-session.md` updated with the exact next recommended task.
