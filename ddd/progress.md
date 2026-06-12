# DDD Migration Progress

Clean slate started: 2026-06-11

## Source Of Truth

- Approved decision summary: `ddd/grill-me-summary.md`
- Approved migration plan: `ddd/migration-plan.md`
- Agent handoff protocol: `ddd/agent-handoff-protocol.md`
- Next-session handoff: `ddd/next-session.md`

## Current Status

- Planning/grill-me pass is complete.
- Final DDD docs consistency review completed on 2026-06-11.
- Slice `-1` and Slice `0` initial implementation completed on 2026-06-11.
- Foundation DDD folders and shared primitives are in place.
- Slice `-1` customer order-read ownership characterization gap was fixed on 2026-06-11.
- Slice `0.5` transitional product money persistence implementation completed on 2026-06-11.
- New-session protocol/read-state verification completed on 2026-06-11 with no Slice `1` implementation changes.
- Slice `1` domain and fake-port application contract started on 2026-06-11.
- Slice `1` DB-backed schema/adapters and guarded stock integration coverage added on 2026-06-11.
- Slice `1` account-deletion-safe purchase/seller-order history hardening added on 2026-06-11.
- Slice `1` notification creation event-contract hardening added on 2026-06-11.
- Slice `1` notification boundary/UI moved to purchase/seller-order IDs on 2026-06-11.
- Slice `1` checkout delivery wiring to the DB-backed `PlacePurchase` path added on 2026-06-12.

## Latest Session Notes

- Added `placePurchaseFn` as the TanStack server-function delivery adapter for the new `PlacePurchase` use case.
- Added a checkout DTO boundary for the current cart/order payload shape:
  - validates `items[].productId`, positive integer quantities, shipping address, and existing payment-method selection
  - maps `productId` to the target `listingId` command field
- Added a server delivery helper that:
  - builds an explicit `Actor` from authenticated server-function context
  - derives buyer snapshot fields from authenticated user context and checkout shipping input
  - calls `PlacePurchase`
  - maps typed `PlacePurchase` errors to request errors with appropriate status codes
- Added a Prisma composition factory for `PlacePurchase` so the adapter graph is centralized behind one module interface.
- Updated the existing `createOrder` mutation compatibility wrapper to call `placePurchaseFn` instead of posting to `/api/orders`.
- Kept old order read APIs and the old `/api/orders` create route in place as compatibility; checkout mutation now uses the target DDD path.
- Refactored the DB integration test to use the production Prisma composition factory.

## Files Changed In Latest Session

- `src/domains/ordering/dto/place-purchase-request.ts`
- `src/domains/ordering/infrastructure/prisma-place-purchase.ts`
- `src/domains/shared/infrastructure/prisma-unit-of-work.ts`
- `src/server/place-purchase-service.ts`
- `src/server/place-purchase-service.test.ts`
- `src/server/order.functions.ts`
- `src/lib/tanstack-query/orders-queries.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Latest Session

- `bun run test:unit -- src/server/place-purchase-service.test.ts src/domains/ordering/application/place-purchase.test.ts src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts` passed: 3 files, 17 tests.
- `bun run typecheck` passed.
- `bun run test:unit` passed: 19 files passed, 1 DB integration file skipped by default; 165 tests passed, 4 skipped.
- `bunx biome check src/domains/ordering/dto/place-purchase-request.ts src/domains/ordering/infrastructure/prisma-place-purchase.ts src/domains/shared/infrastructure/prisma-unit-of-work.ts src/server/place-purchase-service.ts src/server/order.functions.ts src/lib/tanstack-query/orders-queries.ts src/domains/ordering/application/place-purchase.prisma.test.ts src/server/place-purchase-service.test.ts` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed after sandbox escalation was required for localhost database access: 1 file, 4 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run build` passed.
- `bun run docs:check` passed.

## Decisions In Latest Session

- Preserve existing checkout UX and `createOrder` mutation naming as a compatibility wrapper while changing its implementation to the target `PlacePurchase` path.
- Keep the current payment-method selection validated at the delivery DTO edge, but do not let it alter domain payment state; current checkout still creates `Purchase.paymentStatus = MANUALLY_CONFIRMED`.
- Keep Prisma singleton access lazy in the server delivery helper so unit tests can exercise the delivery mapping module without importing environment-bound infrastructure.

## Risks / Follow-Ups From Latest Session

- No browser/manual checkout smoke test was run in this session.
- Old order read APIs still read legacy `Order` / `OrderItem` records until Slice `2` read-model migration.
- The old `/api/orders` POST route and `createOrderService` remain as compatibility/dead-path risk until API cleanup confirms no callers remain.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 1 Notification Boundary Session Notes

- Updated the notification DTO boundary to expose target DDD IDs:
  - `purchaseId`
  - `sellerOrderId`
- Notification API reads now select and map notification rows into a DTO that omits legacy `orderId`.
- Notification creation helper now accepts only generic notification fields plus target `purchaseId` / `sellerOrderId` links.
- Removed legacy `orderId` notification payloads from the old fake order creation bridge; those old notifications remain generic until checkout delivery is rewired to `PlacePurchase`.
- Updated full-page and dropdown notification UI classification:
  - `sellerOrderId` takes precedence and renders a seller-order label/icon
  - `purchaseId` without `sellerOrderId` renders a buyer purchase label/icon
  - notifications without ordering IDs use the generic fallback
- Existing checkout delivery still uses `usePlaceOrder` -> `createOrder` -> `/api/orders`; the new `PlacePurchase` path is not wired to UI/server functions yet.

## Files Changed In Previous Slice 1 Notification Boundary Session

- `src/types/notification.ts`
- `src/data/notification-repo.ts`
- `src/data/order.repo.ts`
- `src/routes/notifications.tsx`
- `src/components/notification-list.tsx`
- `src/components/notification-display.tsx`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 1 Notification Boundary Session

- `bun run typecheck` passed.
- `bunx biome check src/types/notification.ts src/data/notification-repo.ts src/data/order.repo.ts src/routes/notifications.tsx src/components/notification-list.tsx src/components/notification-display.tsx` passed.

## Decisions In Previous Slice 1 Notification Boundary Session

- Do not preserve legacy `orderId` as the notification boundary or UI classification field because current database data is seed/dev data.
- Keep notification read-model/UI migration focused to DTO/classification; do not add broad navigation to purchase/seller-order detail routes in this step.

## Risks / Follow-Ups From Previous Slice 1 Notification Boundary Session

- New `PlacePurchase` Prisma adapters are covered by integration tests but not yet wired to a server function or checkout UI.
- The old fake order creation bridge can still create generic notifications without DDD ordering IDs until checkout delivery is rewired.
- The local Postgres container `riff-ddd-postgres` is running outside the repo; future DB integration runs need Docker/Postgres available and may require sandbox escalation for localhost access.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 1 Notification Creation Session Notes

- Updated `PrismaPurchasePlacedNotificationCreator` to consume and validate the domain events passed by `PlacePurchase`.
- The creator now requires:
  - exactly one `PurchasePlaced` event for the createdFrom purchase
  - one `SellerOrderCreated` event per seller order
  - event payload IDs, totals, currencies, and aggregate IDs to match the aggregate state
- Notification writes now use event payload values for `purchaseId`, `sellerOrderId`, `sellerId`, `customerId`, totals, and currency where those facts exist.
- The creator still uses aggregate state only for display details not currently carried by events, such as seller-order listing names.
- Added focused creator tests for:
  - buyer and seller notifications when required events exist
  - failure when `PurchasePlaced` is missing
  - failure when a `SellerOrderCreated` event is missing for one seller order
- Existing checkout delivery still uses `usePlaceOrder` -> `createOrder` -> `/api/orders`; the new `PlacePurchase` path is not wired to UI/server functions yet.

## Files Changed In Previous Slice 1 Notification Creation Session

- `src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.ts`
- `src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 1 Notification Creation Session

- `bun run typecheck` passed.
- `bun run test:unit -- src/domains/ordering/application/place-purchase.test.ts src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts` passed: 2 files, 13 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed after sandbox escalation was required for localhost database access: 1 file, 4 tests.
- `bunx biome check src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.ts src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts src/domains/ordering/application/place-purchase.test.ts` passed.

## Decisions In Previous Slice 1 Notification Creation Session

- Keep the approved event-driven notification creation contract.
- Keep `purchase` and `sellerOrders` in the notification creation input for display details and consistency checks.
- Do not migrate notification read models or UI in this slice-focused hardening step.

## Risks / Follow-Ups From Previous Slice 1 Notification Creation Session

- New `PlacePurchase` Prisma adapters are covered by integration tests but not yet wired to a server function or checkout UI.
- Notification read DTO/UI still only treated old `orderId` as a first-class navigation/display affordance at that point.
- The local Postgres container `riff-ddd-postgres` is running outside the repo; future DB integration runs need Docker/Postgres available and may require sandbox escalation for localhost access.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 1 Account Deletion Session Notes

- Added account-deletion-safe history persistence for target `Purchase` / `SellerOrder` rows:
  - `Purchase.customerId` is now a nullable live `User` FK with `ON DELETE SET NULL`.
  - `Purchase.customerIdSnapshot` stores the immutable buyer ID captured at purchase placement.
  - `SellerOrder.sellerId` is now a nullable live `User` FK with `ON DELETE SET NULL`.
  - `SellerOrder.sellerIdSnapshot` stores the immutable seller ID captured at seller-order creation.
  - `Purchase -> SellerOrder` and `SellerOrder -> SellerOrderItem` cascade behavior is unchanged.
- Added migration `20260611110000_account_deletion_safe_purchase_history` to backfill snapshots from existing live IDs, enforce non-null snapshots, and replace user FKs with `SET NULL`.
- Updated Prisma purchase/seller-order persistence adapters to write live FK and snapshot values from the same required domain IDs at creation time.
- Extended DB integration coverage to prove buyer/seller user deletion nulls only the live FKs while preserving `Purchase`, `SellerOrder`, `SellerOrderItem`, and seller item snapshots.
- Existing checkout delivery still uses `usePlaceOrder` -> `createOrder` -> `/api/orders`; the new `PlacePurchase` path is not wired to UI/server functions yet.

## Files Changed In Previous Slice 1 Account Deletion Session

- `prisma/schema.prisma`
- `prisma/migrations/20260611110000_account_deletion_safe_purchase_history/migration.sql`
- `src/domains/ordering/infrastructure/prisma-purchase-persistence.ts`
- `src/domains/ordering/infrastructure/prisma-seller-order-persistence.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 1 Account Deletion Session

- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate deploy` passed after sandbox escalation was required for localhost database access.
- `bun run typecheck` passed.
- `bun run test:unit -- src/domains/listings/domain/listing.test.ts src/domains/ordering/domain/purchase.test.ts src/domains/ordering/domain/seller-order.test.ts src/domains/ordering/application/place-purchase.test.ts` passed: 4 files, 29 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed after sandbox escalation was required for localhost database access: 1 file, 4 tests.
- `bunx biome check prisma/schema.prisma src/domains/ordering/infrastructure/prisma-purchase-persistence.ts src/domains/ordering/infrastructure/prisma-seller-order-persistence.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed.

## Decisions In Previous Slice 1 Account Deletion Session

- Preserve target purchase/seller-order history across account deletion by separating nullable live user FKs from non-null immutable ID snapshots.
- Keep domain creation semantics strict: `Purchase` still requires a buyer ID and `SellerOrder` still requires a seller ID.
- Do not migrate old fake `Order` read models or delivery paths as part of this hardening step.

## Risks / Follow-Ups From Previous Slice 1 Account Deletion Session

- New `PlacePurchase` Prisma adapters are covered by integration tests but not yet wired to a server function or checkout UI.
- The local Postgres container `riff-ddd-postgres` is running outside the repo; future DB integration runs need Docker/Postgres available and may require sandbox escalation for localhost access.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 1 DB Session Notes

- Started Docker Desktop and a local Postgres container named `riff-ddd-postgres` using the existing `postgres:16` image.
- Verified and applied existing migrations against `postgresql://user:pass@localhost:5432/riff`:
  - `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` initially reported five pending migrations.
  - `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate deploy` applied `0_init`, media cleanup migrations, and `20260611043000_add_product_money_columns`.
  - A follow-up migration status check reported the database schema was up to date.
  - `Product` table inspection confirmed `priceCents`, `currencyCode`, and `Product_priceCents_idx`.
- Added `Purchase`, `SellerOrder`, and `SellerOrderItem` Prisma models with cents-only money fields and target ordering statuses.
- Added optional `Notification.purchaseId` and `Notification.sellerOrderId` links while keeping legacy `orderId` compatibility.
- Added tracked migration `20260611100000_add_purchase_seller_order_models`.
- Applied the new migration to the local Postgres container and regenerated the local Prisma client.
- Added Prisma infrastructure:
  - `PrismaUnitOfWork`
  - `PrismaListingsForPurchase`
  - `PrismaPurchasePersistence`
  - `PrismaSellerOrderPersistence`
  - `PrismaPurchaseNumberGenerator`
  - `PrismaPurchasePlacedNotificationCreator`
- `PrismaListingsForPurchase.reserveForPurchase(...)` now aggregates duplicate listing IDs, loads products inside the transaction, rejects missing/unapproved/missing-cent-price listings, and decrements stock with an atomic `stock >= quantity` guarded update.
- Added DB integration tests for:
  - successful purchase placement persistence with seller orders, item snapshots, notification links, and stock reduction
  - transaction rollback when notification creation fails after stock/persistence writes
  - concurrent oversell prevention through guarded stock mutation
- Normal `bun run test:unit` skips DB integration tests unless `RUN_DB_TESTS=1` and `DATABASE_URL` are set.
- Existing checkout delivery still uses `usePlaceOrder` -> `createOrder` -> `/api/orders`; the new `PlacePurchase` path is not wired to UI/server functions yet.

## Files Changed In Previous Slice 1 DB Session

- `prisma/schema.prisma`
- `prisma/migrations/20260611100000_add_purchase_seller_order_models/migration.sql`
- `src/domains/shared/domain/domain-event.ts`
- `src/domains/shared/infrastructure/prisma-unit-of-work.ts`
- `src/domains/listings/domain/listing.ts`
- `src/domains/listings/domain/listing.test.ts`
- `src/domains/ordering/domain/purchase.ts`
- `src/domains/ordering/domain/purchase.test.ts`
- `src/domains/ordering/domain/seller-order.ts`
- `src/domains/ordering/domain/seller-order.test.ts`
- `src/domains/ordering/application/place-purchase.ts`
- `src/domains/ordering/application/place-purchase.test.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `src/domains/ordering/infrastructure/prisma-listings-for-purchase.ts`
- `src/domains/ordering/infrastructure/prisma-purchase-persistence.ts`
- `src/domains/ordering/infrastructure/prisma-seller-order-persistence.ts`
- `src/domains/ordering/infrastructure/prisma-purchase-number-generator.ts`
- `src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 1 DB Session

- `docker exec riff-ddd-postgres pg_isready -U user -d riff` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate deploy` passed for existing migrations and then for `20260611100000_add_purchase_seller_order_models`.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` passed: database schema is up to date.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed: 1 file, 3 tests.
- `bun run test:unit` passed: 16 files, 155 tests; 1 DB integration file skipped by default.
- `bun run typecheck` passed.
- `bunx biome check <touched schema/domain/application/infrastructure files>` passed.

## Decisions In Previous Slice 1 DB Session

- No approved architecture decisions changed.
- Keep old `Order` / `OrderItem` tables and notification `orderId` as compatibility while adding target `Purchase` / `SellerOrder` persistence.
- Keep seller-order item `listingId` as a snapshot string without a `Product` foreign key so order history can survive later listing withdrawal/deletion semantics.
- Add database check constraints for non-negative cent amounts and positive seller-order item quantities.
- Run DB integration tests only when explicitly enabled with `RUN_DB_TESTS=1` and `DATABASE_URL`, so the normal unit suite remains runnable without local Postgres.

## Risks / Follow-Ups From Previous Slice 1 DB Session

- New `PlacePurchase` Prisma adapters are covered by integration tests but not yet wired to a server function or checkout UI.
- The local Postgres container `riff-ddd-postgres` is running outside the repo; future DB integration runs need Docker/Postgres available.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 1 Domain Session Notes

- Attempted the required real local DB verification for the product money migration before adding Slice `1` code.
  - `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` failed with Prisma `Schema engine error`.
  - Retrying the same command with sandbox escalation produced the same error.
  - Escalated `nc -vz localhost 5432` returned `Connection refused`, so local Postgres was not reachable.
- Continued with the non-DB Slice `1` fake-port contract work because the approved plan allows domain and fake-port use-case tests before Prisma wiring.
- Added a shared domain-event factory to centralize event ID and timestamp creation.
- Added `Listing` purchase behavior:
  - approved/orderable checks
  - positive quantity validation
  - stock availability validation
  - stock reduction
  - reserved item snapshot for purchase placement
- Added `Purchase` domain behavior:
  - customer ID
  - purchase number
  - total `Money`
  - `MANUALLY_CONFIRMED` payment status
  - `OPEN` purchase status
  - buyer/contact/shipping snapshot
  - seller-order count invariant
  - `PurchasePlaced` event
- Added `SellerOrder` domain behavior:
  - seller ID
  - immutable item snapshots with integer-cent money fields
  - subtotal `Money`
  - `NEW` status for manual-payment checkout
  - nullable tracking number
  - seller/admin management permission check
  - `SellerOrderCreated` event
- Added `PlacePurchase` application use case with fake-port tests and first port contracts:
  - `ListingsForPurchasePort.reserveForPurchase(...)`
  - purchase persistence
  - seller-order persistence
  - purchase number generation
  - same-transaction notification creation
- `PlacePurchase` uses explicit `Actor`, rejects non-customers before opening a transaction, and throws internal rollback errors for expected in-transaction failures so real unit-of-work implementations can roll back.
- `PlacePurchase` validates required buyer snapshot fields before opening a transaction.
- Fake-port tests prove customer-only placement, empty/invalid item rejection, invalid buyer snapshot rejection, missing/unapproved/insufficient-stock rejection, duplicate listing aggregation, multi-seller grouping, integer-cent totals/subtotals, manual-payment statuses, and notification creation with pulled domain events.
- No Prisma purchase/seller-order schema or infrastructure adapters were added in this session.

## Files Changed In Previous Slice 1 Domain Session

- `src/domains/shared/domain/domain-event.ts`
- `src/domains/listings/domain/listing.ts`
- `src/domains/listings/domain/listing.test.ts`
- `src/domains/ordering/domain/purchase.ts`
- `src/domains/ordering/domain/purchase.test.ts`
- `src/domains/ordering/domain/seller-order.ts`
- `src/domains/ordering/domain/seller-order.test.ts`
- `src/domains/ordering/application/place-purchase.ts`
- `src/domains/ordering/application/place-purchase.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 1 Domain Session

- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` failed: Prisma `Schema engine error`.
- Escalated `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` failed with the same Prisma `Schema engine error`.
- Sandbox `nc -vz localhost 5432` failed with `Operation not permitted`.
- Escalated `nc -vz localhost 5432` failed with `Connection refused`.
- `bun run test:unit -- src/domains/listings/domain/listing.test.ts src/domains/ordering/domain/purchase.test.ts src/domains/ordering/domain/seller-order.test.ts src/domains/ordering/application/place-purchase.test.ts` passed: 4 files, 29 tests.
- `bun run typecheck` passed.
- `bunx biome check --write <touched domain/application files>` passed and formatted files.
- `bunx biome check <touched domain/application files>` passed.
- `bun run test:unit` passed: 16 files, 155 tests.
- `bun run docs:check` passed.

## Decisions In Previous Slice 1 Domain Session

- No approved architecture decisions changed.
- Model `Purchase.buyerPhone` as `string | null` because current user settings store phone as nullable.
- Keep the current Slice `1` work at the domain/application fake-port layer until a real local DB is available for migration verification and Prisma integration tests.
- Use `SellerOrderCreated` alongside `PurchasePlaced` so same-transaction notification creation can receive both purchase and seller-order facts without repository orchestration.
- Keep `PlacePurchase` persistence ports narrow and transaction-context explicit; repositories will persist/map only and not orchestrate workflows.
- Continue treating existing product moderation tests as current-state discovery, not target compatibility for Slice `3`.

## Risks / Follow-Ups From Previous Slice 1 Domain Session

- The product money migration still needs verification against a real local database before relying on Prisma runtime behavior; local Postgres was not running on `localhost:5432` in this session.
- There are no repo-root `.env`, `.env.local`, or `.env.example` files in this worktree, so real DB verification still requires providing environment values explicitly.
- Prisma `Purchase` / `SellerOrder` schema, infrastructure adapters, notification persistence links, and DB integration/concurrency tests are not implemented yet.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Protocol-Only Session Notes

- Protocol-only session before this implementation verified repo state and updated handoff docs with no implementation changes.

## Previous Session Notes

- Completed Slice `0.5`: product/listing money persistence migration while persistence vocabulary is still `Product`.
- Added transitional `Product.priceCents` and `Product.currencyCode` schema fields.
- Added a tracked Prisma migration that:
  - adds nullable `priceCents`
  - adds defaulted `currencyCode = 'USD'`
  - backfills `priceCents` from existing Float `price` using deterministic SQL rounding
  - indexes `priceCents`
- Added listing money mapping helpers covering:
  - decimal input parsing to integer cents
  - optional query price parsing
  - legacy Float-to-cent backfill conversion
  - dual-write persistence payloads
  - read fallback that prefers cents and falls back to legacy Float only when cents are absent
  - cent-based price range conversion with legacy Float fallback ranges
- Refactored product money validation so Zod schemas share one price-error adapter instead of duplicating parse/catch logic.
- Product create/update paths now dual-write:
  - legacy decimal `price`
  - integer `priceCents`
  - `currencyCode`
- Product read paths select `priceCents` and `currencyCode`, then normalize `price` from cents for existing UI compatibility.
- Approved product price filters now parse to `priceMinCents` / `priceMaxCents` at the DTO boundary and query cents with Float fallback for old rows.
- Product API create/update adapters now pass raw price strings into validation so max-two-decimal validation is not bypassed by early `Number(...)` conversion.
- Regenerated the ignored local Prisma client after the schema change.

## Files Changed In Previous Session

- `prisma/schema.prisma`
- `prisma/migrations/20260611043000_add_product_money_columns/migration.sql`
- `src/domains/listings/application/product-money.ts`
- `src/domains/listings/application/product-money.test.ts`
- `src/lib/zod/product-validation.ts`
- `src/data/product-repo.ts`
- `src/actions/product.ts`
- `src/actions/product.test.ts`
- `src/routes/api/products.ts`
- `src/routes/api/products.$id.ts`
- `src/types/product.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Session

- `bun run test:unit -- src/domains/listings/application/product-money.test.ts` passed: 1 file, 9 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `bun run test:unit -- src/domains/listings/application/product-money.test.ts src/actions/product.test.ts src/domains/shared/domain/money.test.ts src/actions/order.test.ts` passed: 4 files, 82 tests.
- `bun run typecheck` passed.
- `bunx biome check <touched implementation files>` passed.
- `bun run docs:check` passed.
- `bun run test:unit` passed: 12 files, 126 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.

## Decisions In Previous Session

- Keep public product response compatibility by continuing to expose decimal `price`, normalized from `priceCents` when available.
- Keep `priceCents` nullable during the transition so older rows and out-of-band writes do not break before full cutover.
- Use `USD` as the transitional product currency code.
- Do not migrate old fake `Order` / `OrderItem` Float money fields in Slice `0.5`.
- Keep existing cart/order compatibility for now by normalizing product repo reads rather than rewriting checkout.

## Risks / Follow-Ups From Previous Session

- The new migration file exists but was not applied against a real local database in this session.
- Existing fake `Order` / `OrderItem` persistence still stores Float money and remains a migration bridge only.
- `src/actions/order.test.ts` still contains the expected-failing seller status update ownership test; address it in the seller-order lifecycle/security slice or another narrow authorization fix.
- `ddd/` files are committed as temporary worktree handoff docs and should be removed before opening a PR.
- Full `bun run check` was not rerun; previous full-check formatting issues outside the touched files may still exist.

## Previous Session Notes

- Fixed the Slice `-1` customer order read authorization characterization gap without migrating order architecture.
- Updated `getOrderByIdService` to receive the authenticated `userId` along with `role` and `orderId`.
- Updated `/api/orders/$id` GET delivery adapter to pass `context.id` into `getOrderByIdService`.
- Converted the expected-failing customer order-read test into passing security characterization coverage.
- Added positive coverage proving a customer can read their own order.
- Kept the seller order-status ownership test as expected-failing characterization for a later seller-order lifecycle/security slice.

## Files Changed In Previous Session

- `src/actions/order.ts`
- `src/actions/order.test.ts`
- `src/routes/api/orders.$id.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Session

- `bun run test:unit -- src/actions/order.test.ts` passed: 1 file, 3 tests.
- `bun run typecheck` passed.
- `bunx biome check src/actions/order.ts src/actions/order.test.ts 'src/routes/api/orders.$id.ts'` passed.

## Decisions In Previous Session

- Keep this as a narrow Slice `-1` fix in the existing action/API route seam.
- Do not introduce `Purchase`, `SellerOrder`, new ordering use cases, or domain actor wiring yet.
- Do not add tests asserting old fake `Order` / `OrderItem` internals beyond the minimal `userId` ownership field needed for authorization.

## Risks / Follow-Ups From Previous Session

- `src/actions/order.test.ts` still contains the expected-failing seller status update ownership test; address it in the seller-order lifecycle/security slice or another narrow authorization fix.
- The next planned migration task remains Slice `0.5`: product/listing cent-based money persistence.

## Recent Session Notes

- Implementation session started by reading the required handoff files in order:
  - `ddd/agent-handoff-protocol.md`
  - `ddd/next-session.md`
  - `ddd/migration-plan.md`
  - `ddd/grill-me-summary.md`
  - `ddd/progress.md`
- Inspected checkout/order/listing-related test coverage:
  - No existing order action tests were present.
  - Existing product action tests cover listing/product moderation service behavior.
  - Existing moderation coverage still reflects current `Product.isApproved` and delete-on-decline behavior; it must not become a target compatibility requirement because approved DDD behavior says declined listings become `DECLINED`, not deleted.
- Added narrow order security characterization tests in `src/actions/order.test.ts`:
  - expected-failing test for customer order-by-id reads lacking actor ownership validation
  - expected-failing test for seller order-status updates lacking seller ownership validation
  - These tests encode desired secure behavior and intentionally do not assert old `Order` / `OrderItem` persistence internals.
- Added Slice `0` foundation files:
  - `src/domains/shared/domain/actor.ts`
  - `src/domains/shared/domain/domain-event.ts`
  - `src/domains/shared/domain/result.ts`
  - `src/domains/shared/application/unit-of-work.ts`
  - `src/domains/shared/domain/money.ts`
  - `src/domains/shared/domain/money.test.ts`
- Added DDD context/layer folders for:
  - `accounts`
  - `listings`
  - `media`
  - `notifications`
  - `ordering`
  - `reviews`
- Added focused `Money` tests for:
  - integer cent construction
  - invalid cent rejection
  - invalid currency code rejection
  - same-currency add/subtract
  - cross-currency arithmetic rejection
  - non-negative integer multiplication
- Fixed `src/test/api-products-id-route.test.ts` to pass a serialized form body to `Request`; this keeps the existing listing/product route test runnable under the current unit test environment.
- Previous planning session notes:
  - reviewed DDD handoff docs for stale source-of-truth references and old order compatibility wording
  - updated handoff/read-order wording in `ddd/next-session.md`
  - clarified that `ddd/progress.md` is the fresh implementation progress log, not raw grill-me history
  - incorporated historical adversarial review findings into the approved plan and summary
  - renamed the migration plan's final backlog section to approved deferred work
  - made no repo implementation changes during that planning-only pass

## Files Changed In Previous Foundation Session

- `src/actions/order.test.ts`
- `src/domains/shared/domain/actor.ts`
- `src/domains/shared/domain/domain-event.ts`
- `src/domains/shared/domain/result.ts`
- `src/domains/shared/domain/money.ts`
- `src/domains/shared/domain/money.test.ts`
- `src/domains/shared/application/unit-of-work.ts`
- `src/domains/{accounts,listings,media,notifications,ordering,reviews}/{domain,application,infrastructure,dto}/.gitkeep`
- `src/test/api-products-id-route.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Foundation Session

- `bun install --frozen-lockfile` passed after sandbox escalation was required for Bun tempdir writes.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed after sandbox escalation was required for Prisma engine-cache writes.
- `bun run test:unit -- src/domains/shared/domain/money.test.ts src/actions/order.test.ts` passed.
- `bun run typecheck` passed.
- `bun run test:unit` passed: 11 files, 113 tests.
- `bun run check` was run and reported formatting issues in unrelated pre-existing files, plus touched files before formatting.
- `bun run format:fix -- <touched files>` passed.
- `bunx biome check <touched files>` passed.

## Decisions In Previous Foundation Session

- Use `it.fails` for current order security gaps so the suite documents desired secure behavior without preserving vulnerable behavior.
- Do not add broad checkout characterization tests yet because current checkout persistence is the old fake `Order` / `OrderItem` shape and should not be treated as a compatibility requirement.
- Do not add new listing moderation behavior tests yet; existing tests are enough to reveal the current delete-on-decline behavior, and later listing slices should replace that with `DECLINED`.
- Keep `Money` intentionally small for Slice `0`: integer cents, uppercase three-letter currency code, same-currency arithmetic, comparisons, multiplication, and JSON shape.
- Do not add server-only infrastructure import guards yet because Slice `0` added no infrastructure adapters.

## Risks / Follow-Ups From Previous Foundation Session

- The remaining `it.fails` security test in `src/actions/order.test.ts` should be converted to a normal passing test when the seller status update ownership gap is fixed.
- Existing product moderation tests still contain wording and behavior from the old model, especially delete-on-decline. Treat them as current-state discovery, not target DDD behavior.
- Money persistence still uses Float fields in current `Product`, `Order`, and `OrderItem` persistence. New DDD code must not build further money behavior on those Float fields.
- Full `bun run check` still has unrelated pre-existing formatting issues outside the touched Slice `-1`/`0` files.

## Active Todo

- [x] Start Slice `-1`: narrow risk/security characterization review.
- [x] Start Slice `0`: foundation primitives and folder structure.
- [x] Add `Money` tests.
- [x] Start Slice `0.5`: money persistence migration.
- [x] Add transitional `Product.priceCents` and `Product.currencyCode` persistence support with deterministic mapper/backfill tests and create/update dual-write behavior.
- [x] Start Slice `1` with listing/purchase/seller-order domain models and fake-port `PlacePurchase` tests.
- [x] Add DB-backed `Purchase` / `SellerOrder` schema, Prisma adapters, and guarded stock integration tests.
- [x] Add `placePurchaseFn` delivery wiring and update checkout/order mutation compatibility to call the new `PlacePurchase` path.
- [ ] Exact next task: smoke-test checkout through the new server-function path, then start Slice `2` purchase/seller-order lifecycle and read-model migration.
- [ ] Update this progress log at the end of each future session.
