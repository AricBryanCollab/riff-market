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

Continue Slice `2`: verify the completed server-function order flow, then move to the next migration slice.

Exact next task:

- Browser-smoke the active order server-function flow:
  - seller settings list loads through `listOrdersForCurrentUserFn`
  - seller can move `NEW -> PROCESSING`
  - seller can move `PROCESSING -> SHIPPED` only after entering a tracking number
  - seller can move `SHIPPED -> DELIVERED`
  - customer settings list still loads purchase history
- Rerun the gated DB integration test after the route/action cleanup if local Postgres is available.
- If smoke passes, start Slice `3` listing lifecycle. If smoke reveals a status/read issue, fix it before starting Slice `3`.
- Active order delivery is now server functions only for migrated flows:
  - `listOrdersForCurrentUserFn`
  - `getOrderDetailFn`
  - `changeSellerOrderStatusFn`
- The old `/api/orders`, `/api/orders/seller`, and `/api/orders/$id` route files have been deleted.
- `src/actions/order.ts`, `src/data/order.repo.ts`, and the old fake-order helper files have been deleted.
- Keep old cart details reads and non-order legacy APIs as temporary compatibility only where callers still need them.
- Preserve the existing checkout success/error UX and the smoked `usePlaceOrder` -> `createOrder` -> `placePurchaseFn` -> `PlacePurchase` delivery path.
- Fix or track the non-fatal add-to-cart router warning from `src/components/product-actions.tsx` (`navigate({ from: "/cart" })`) before broad checkout polish.
- Fix or track misleading server-function request logging in `requestLoggerMiddleware`; successful server-function return values without a `Response` wrapper are currently logged as status `500`.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `1`
- `src/domains/listings/domain/listing.ts`
- `src/domains/ordering/domain/purchase.ts`
- `src/domains/ordering/domain/seller-order.ts`
- `src/domains/ordering/dto/order-read-model.ts`
- `src/domains/ordering/application/change-seller-order-status.ts`
- `src/domains/ordering/application/order-read-models.ts`
- `src/domains/ordering/infrastructure/prisma-seller-order-status-repository.ts`
- `src/domains/ordering/infrastructure/prisma-order-read-models.ts`
- `src/domains/ordering/application/place-purchase.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `src/domains/ordering/infrastructure/prisma-listings-for-purchase.ts`
- `src/domains/shared/domain/money.ts`
- `src/domains/shared/application/unit-of-work.ts`
- `src/domains/shared/infrastructure/prisma-unit-of-work.ts`
- `src/server/function-middleware.ts`
- `src/server/order.functions.ts`
- `src/server/order-service.ts`
- `src/server/place-purchase-service.ts`
- `src/server/user.functions.ts`
- `src/hooks/use-place-order.ts`
- `src/lib/tanstack-query/orders-queries.ts`
- `src/data/product-repo.ts`
- `src/types/order.ts`
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
  - work completed: Slice `2` active order read/detail/status delivery moved from order API routes to TanStack server functions; seller settings status controls added with required shipping tracking number; old `/api/orders` route family, `src/actions/order.ts`, `src/data/order.repo.ts`, and fake-order helper files deleted
  - files changed: new `src/server/order-service.ts` and test, `src/server/order.functions.ts`, order query/hook wrappers, seller settings orders UI, route tree, order read-model files from the detail-read migration, `src/types/order.ts`, `ddd/progress.md`, `ddd/next-session.md`; deleted old order API/action/repo/helper files
  - tests/checks run: focused server-service/read/status tests passed; typecheck passed; touched-file Biome passed; full unit suite passed with gated DB tests skipped by default; docs check passed; production build passed with existing large client chunk warning
  - decisions made: migrated order flows use server functions only; no `/api/orders` compatibility shell remains; status delivery coverage lives at the server-service/application boundary, not route delegation
  - blockers or risks: no browser smoke was completed for seller status controls because `bun run dev` failed on an internal framework port and `vite preview` kept scanning occupied ports; gated DB integration was not rerun after route/action cleanup; server-function request logging still misreports successful non-`Response` returns
  - exact next recommended task: browser-smoke seller status and customer/seller settings reads, rerun the gated DB integration test if local Postgres is available, then start Slice `3` listing lifecycle if clean
- Latest implementation session completed on 2026-06-12:
  - work completed: Slice `2` target order detail reads added for `/api/orders/$id` GET; customers read by `Purchase.id`, sellers by `SellerOrder.id`, admins by either
  - files changed: ordering read use case/test, Prisma order read adapter, gated DB integration test, legacy detail service delegation, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused order-detail/action tests passed; typecheck passed; touched-file Biome passed; escalated gated DB integration test passed; full unit suite passed with DB integration skipped by default; docs check passed
  - decisions made: keep `/api/orders/$id` GET as a compatibility route but delegate to target ordering reads; unauthorized customer/seller detail reads return not found; `src/actions/order.ts` remains temporary compatibility glue only
  - blockers or risks: no browser smoke was run for target detail reads; seller status UI still needs tracking-number support; old `/api/orders` POST and `createOrderService` remain compatibility/dead-path risk
  - exact next recommended task: add status caller support for shipping tracking numbers or hide ship transitions, then continue draining legacy order compatibility paths
- Latest implementation session completed on 2026-06-12:
  - work completed: Slice `2` seller-order lifecycle/status update path started; `SellerOrder` has transition methods/events; `ChangeSellerOrderStatus` enforces actor ownership; `/api/orders/$id` PUT now delegates status changes to target `SellerOrder`
  - files changed: seller-order domain/test, new change-status use case/test, new Prisma seller-order status repository, status integration coverage, legacy order status service/route wrapper, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused seller-order/change-status/action tests passed; typecheck passed; touched-file Biome passed after formatting; escalated gated DB integration test passed
  - decisions made: treat `/api/orders/$id` PUT id as `SellerOrder.id`; keep `/api/orders/$id` GET legacy until target detail reads are migrated; `PENDING` is not a target seller-order command status; `SHIPPED` requires a tracking number; status-change events are captured but not dispatched yet
  - blockers or risks: seller status UI/caller still needs tracking-number support before exposing `SHIPPED`; legacy `/api/orders/$id` GET still reads old `Order`; no browser status smoke was run; full delivery coverage for seller status is intentionally deferred until the server-function/application flow is sliced out
  - exact next recommended task: migrate order detail/admin reads to a target purchase/seller-order read model, polish status update caller support for tracking numbers, then add a behavior test at the stable seller-status delivery boundary
- Latest implementation session completed on 2026-06-12:
  - work completed: Slice `2` buyer purchase history and seller-order dashboard list reads now use target `Purchase` / `SellerOrder` read models behind legacy API compatibility shells
  - files changed: new ordering read DTO/use-case/Prisma adapter/test, legacy order repo delegation, seller admin role pass-through, order read status typing, status display labels/styles, gated Prisma integration read assertion, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused order-read/action tests passed; typecheck passed; touched-file Biome passed after formatting; escalated Prisma migrate status passed; escalated gated DB integration test passed; full unit suite passed with DB integration skipped by default; docs check passed
  - decisions made: keep `/api/orders` and `/api/orders/seller` as compatibility shells while moving list read behavior into ordering use cases; buyer list row IDs are `Purchase.id`; seller dashboard row IDs are `SellerOrder.id`; compatibility `trackingNumber` displays purchase number until seller tracking exists; `OrderResponse.paymentMethod` is optional for target reads; defer new server-function read wrappers until request logging is fixed or worked around
  - blockers or risks: status lifecycle is not migrated yet; `/api/orders/$id` detail and PUT still use legacy `Order`; seller status authorization characterization remains expected-failing; no browser read smoke was run for the new read adapter
  - exact next recommended task: add `ChangeSellerOrderStatus` and migrate seller status updates to target `SellerOrder`
- Latest implementation session completed on 2026-06-12:
  - work completed: checkout delivery wiring to the DB-backed `PlacePurchase` path
  - files changed: new place-purchase DTO, Prisma composition factory, server delivery helper/test, `placePurchaseFn`, `createOrder` mutation wrapper, shared Prisma unit-of-work type export, DB integration test factory use, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused delivery/use-case/creator tests passed; typecheck passed; full unit suite passed with DB file skipped by default; touched-file Biome passed; gated DB integration test passed with `RUN_DB_TESTS=1` after sandbox escalation for localhost DB access; production build passed; docs check passed; Codex Desktop in-app browser checkout smoke passed
  - decisions made: preserve checkout UX and `createOrder` mutation naming while changing the mutation implementation to `placePurchaseFn`; keep payment-method selection as DTO validation only; keep Prisma singleton access lazy in the delivery helper
  - blockers or risks: browser smoke found a non-fatal router warning from `navigate({ from: "/cart" })` in product add-to-cart flow; server-function request logging currently reports successful non-`Response` server-function returns as status `500`; legacy order read APIs and old `/api/orders` POST remain until follow-up cleanup; seller status authorization characterization remains expected-failing
  - exact next recommended task: start Slice `2` read/lifecycle migration
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
- Buyer purchase history list reads now query `Purchase` plus joined `SellerOrder` / `SellerOrderItem` snapshots through ordering-context read use cases.
- Seller dashboard list reads now query `SellerOrder` directly through ordering-context read use cases.
- Active order list reads now call `listOrdersForCurrentUserFn`.
- Active order detail reads now call `getOrderDetailFn`; customers read `Purchase.id`, sellers read `SellerOrder.id`, and admins can read either.
- Active seller-order status updates now call `changeSellerOrderStatusFn`.
- Seller settings exposes status controls for processing, shipping with tracking number, delivery, and cancellation where the target lifecycle allows them.
- The `/api/orders` route family, `src/actions/order.ts`, `src/data/order.repo.ts`, and old fake-order helper files have been deleted.
- Slice `-1`, Slice `0`, and Slice `0.5` initial implementation are complete.
- The Slice `-1` customer order-by-id ownership characterization gap is fixed:
  - replacement target read coverage now lives in `src/server/order-service.test.ts` and `src/domains/ordering/application/order-read-models.test.ts`.
- The old action-level seller order-status ownership characterization was removed because it tested implementation details instead of the stable flow. Replacement behavior coverage now exists at the server-service/application boundary.
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

- `bun run test:unit -- src/server/order-service.test.ts src/server/place-purchase-service.test.ts src/domains/ordering/application/order-read-models.test.ts src/domains/ordering/application/change-seller-order-status.test.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed: 4 files passed, 1 DB integration file skipped by default; 37 tests passed, 7 skipped.
- `bun run typecheck` passed.
- `bunx biome check src/server/order-service.ts src/server/order-service.test.ts src/server/order.functions.ts src/lib/tanstack-query/orders-queries.ts src/hooks/use-get-orders.ts src/routes/settings/-components/settings-orders-section.tsx src/types/order.ts src/routeTree.gen.ts src/domains/ordering/application/order-read-models.ts src/domains/ordering/application/order-read-models.test.ts src/domains/ordering/infrastructure/prisma-order-read-models.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed.
- `bun run test:unit` passed: 20 files passed, 1 DB integration file skipped by default; 208 tests passed, 7 skipped.
- `bun run docs:check` passed.
- `bun run build` passed with the existing large client chunk warning.

## Expected End State For Next Session

- Seller status controls are browser-smoked against the server-function flow, including `SHIPPED` tracking-number input.
- Buyer/seller list reads remain backed by target `Purchase` / `SellerOrder` read models through `listOrdersForCurrentUserFn`.
- Order detail reads remain backed by target `GetOrderDetail` through `getOrderDetailFn`.
- Seller status updates remain backed by target `ChangeSellerOrderStatus` through `changeSellerOrderStatusFn`.
- Existing checkout UX remains backed by the server-function `PlacePurchase` path.
- No `/api/orders` compatibility route, old order action layer, or old fake-order repo is reintroduced.
- `ddd/progress.md` updated with:
  - work completed
  - files changed
  - tests/checks run and results
  - decisions made
  - blockers or risks
- `ddd/next-session.md` updated with the exact next recommended task.
