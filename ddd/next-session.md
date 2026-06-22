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

Verify Slice `4` listing query/read-model migration, then begin Slice `5` notifications if clean.

Exact next task:

- Listing/product read routes have moved to listing read-model use cases; do not route them back through `src/actions/product.ts` or `src/data/product-repo.ts`.
- Listing read query parsing now lives in the listings DTO layer, category/condition are typed before Prisma, and `/api/products` compatibility mapping is explicit in `src/server/listing-read-service.ts`.
- Seller listings and pending moderation queue reads have moved to listing read-model use cases; do not route them back through `src/actions/product.ts` or `src/data/product-repo.ts`.
- Count, recent, and cart-detail reads have moved to listing read-model use cases; do not route them back through product actions/repositories.
- `src/actions/product.ts` and `src/data/product-repo.ts` have been deleted; do not reintroduce listing/product behavior there.
- Browser-smoke the read flows before starting Slice `5`:
  - shop approved search/filter reads
  - product detail not-found behavior for missing/non-`APPROVED` listings
  - seller settings listings
  - admin pending moderation queue
  - home recent listings
  - cart and checkout cart detail reads
- If smoke is clean, start Slice `5` notifications from `ddd/migration-plan.md`.
- Move product/listing reads toward listing query use cases/read DTOs under `src/domains/listings`.
- Keep product API routes as compatibility shells only until consumers move.
- Preserve the fixed product detail UX: deleted/missing and non-`APPROVED` product detail compatibility reads return HTTP `404` with the existing "Product not found" state.
- Preserve checkout orderability semantics: `listingStatus = APPROVED` is authoritative for purchase reservation and guarded stock updates; do not use legacy `isApproved` as command authority.
- Preserve product/listing read compatibility at the route/client wrapper boundary until consumers move to listing vocabulary.
- Keep vertical command coverage at `src/server/listing-service.prisma.test.ts`; it intentionally starts at the delivery-facing service boundary and exercises application use cases plus real Prisma infrastructure with a fake image manager.
- Re-run focused read/route tests, typecheck, touched-file Biome, docs check, and the gated DB suite if local Postgres is available.
- Keep these active listing command server functions:
  - `createListingFn`
  - `updateListingFn`
  - `deleteListingFn`
- Keep the existing `moderateListingFn` path for admin approve/decline.
- Preserve intentional delete semantics:
  - hard delete only for safe draft/unreferenced listings
  - referenced listings become `WITHDRAWN`
  - declined listings remain `DECLINED` and do not reappear in pending moderation
- Preserve image upload/compression/cleanup behavior behind application/infrastructure ports; do not put Cloudinary/FormData concerns in domain code.
- Browser smoke completed for seller update, unreferenced delete, referenced withdraw, and admin approve after the command migration.
- Create-listing browser smoke remains blocked until real Cloudinary upload configuration is available.
- Legacy product command action/repository helpers have been removed; do not reintroduce them.
- Legacy product detail/search action and repository helpers have been removed; do not reintroduce them.
- Keep product/listing read APIs as temporary compatibility while UI consumers still use product route vocabulary.
- Slice `4` source migration is drained; remaining Slice `4` work is browser smoke and any fixes found there.
- Active order delivery is now server functions only for migrated flows:
  - `listOrdersForCurrentUserFn`
  - `getOrderDetailFn`
  - `changeSellerOrderStatusFn`
- The old `/api/orders`, `/api/orders/seller`, and `/api/orders/$id` route files have been deleted.
- `src/actions/order.ts`, `src/data/order.repo.ts`, and the old fake-order helper files have been deleted.
- The old `/api/products/pending/$id` moderation route has been deleted.
- Admin moderation now goes through `moderateListingFn`; do not reintroduce `/api/products/pending/$id`.
- `/api/products` is read-only; do not reintroduce POST.
- `/api/products/$id` is read-only; do not reintroduce PUT/DELETE.
- Keep product-route read URLs as temporary compatibility only where callers still need them.
- End-state for listing/product actions: commands drained in Slice `3`, reads drained in Slice `4`; do not treat `src/actions/product.ts` as target architecture.
- Preserve the existing checkout success/error UX and the smoked `usePlaceOrder` -> `createOrder` -> `placePurchaseFn` -> `PlacePurchase` delivery path.
- Fix or track the non-fatal add-to-cart router warning from `src/components/product-actions.tsx` (`navigate({ from: "/cart" })`) before broad checkout polish.
- Fix or track the non-fatal listing moderation success navigation warning from `navigate({ from: "/shop" })`.
- Fix or track misleading server-function request logging in `requestLoggerMiddleware`; successful server-function return values without a `Response` wrapper are currently logged as status `500`.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `3`
- `src/domains/listings/domain/listing.ts`
- `src/domains/listings/application/manage-listing.ts`
- `src/domains/listings/application/manage-listing.test.ts`
- `src/domains/listings/application/moderate-listing.ts`
- `src/domains/listings/infrastructure/prisma-listing-commands.ts`
- `src/domains/listings/infrastructure/prisma-listing-moderation.ts`
- `src/domains/listings/infrastructure/listing-image-assets.ts`
- `src/server/listing.functions.ts`
- `src/server/listing-service.ts`
- `src/server/listing-service.prisma.test.ts`
- `src/lib/tanstack-query/product-queries.ts`
- `src/types/product.ts`
- `src/routes/api/products.$id.ts`
- `src/routes/api/products.ts`
- `src/routes/product/$id.tsx`
- `src/server/listing-read-service.ts`
- `src/server/listing-read-service.test.ts`
- `src/domains/listings/application/listing-read-models.ts`
- `src/domains/listings/dto/listing-read-model.ts`
- `src/domains/listings/infrastructure/prisma-listing-read-models.ts`
- `src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`
- `src/domains/ordering/infrastructure/prisma-listings-for-purchase.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `src/domains/listings/infrastructure/listing-image-assets.test.ts`
- `src/routes/settings/-components/settings-products-section.tsx`
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

- Latest implementation session completed on 2026-06-22:
  - work completed: Slice `4` listing/product read source migration drained; added listing read DTOs/use cases and `PrismaListingReadModels`; moved `/api/products/$id`, `/api/products`, `/api/products/seller`, `/api/products/pending`, `/api/products/count`, `/api/products/recent`, and `/api/products/cart-details` compatibility routes to `src/server/listing-read-service.ts`; deleted `src/actions/product.ts`, `src/data/product-repo.ts`, and their tests; moved active DB behavior coverage for detail/search/seller/pending/count/recent/cart reads to listing infrastructure; kept product-compatible response mapping at the server read boundary
  - files changed: `package.json`, `src/domains/listings/application/listing-read-models.ts`, `src/domains/listings/dto/listing-read-model.ts`, `src/domains/listings/infrastructure/prisma-listing-read-models.ts`, `src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`, `src/server/listing-read-service.ts`, `src/server/listing-read-service.test.ts`, deleted `src/server/product-read-service.ts`, deleted `src/server/product-read-service.test.ts`, deleted `src/actions/product.ts`, deleted `src/actions/product.test.ts`, deleted `src/actions/product.prisma.test.ts`, deleted `src/data/product-repo.ts`, deleted `src/data/product-repo.prisma.test.ts`, `src/lib/zod/product-validation.ts`, product API route files, ordering checkout files touched for `listingStatus` orderability, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused listing read service tests passed with bundled Node; `bun run typecheck` passed; listing read-model Prisma test passed with local DB access during TDD cycles through 9 DB tests; final DB rerun was blocked by the approval reviewer before execution; touched-file Biome passed; `bun run docs:check` passed; `git diff --check` passed
  - decisions made: keep product API route URLs and client query wrapper names as compatibility while route handlers move to listing read use cases; delete `src/actions/product.ts` at the end of Slice `4`; keep product-compatible response mapping at the server read boundary instead of making product shape the listings application contract; treat `listingStatus` as checkout orderability authority and derive legacy `isApproved` only for compatibility output; use behavior-level Prisma tests for read behavior rather than internal collaborator assertions
  - blockers or risks: browser smoke for the drained read routes remains; create-listing browser smoke still needs real Cloudinary config; moderation navigation warning and request logging issue remain; local smoke seed rows remain
  - exact next recommended task: browser-smoke Slice `4` read flows, then start Slice `5` notifications if clean
- Latest implementation session completed on 2026-06-18:
  - work completed: Slice `3` product read/test hardening completed; `/api/products/$id` now returns HTTP `404` for missing/deleted product reads; public product detail hides non-`APPROVED` lifecycle statuses with the existing "Product not found" state; added behavior-level product read Prisma coverage for approved/pending/recent/price-filter semantics; replaced dead image-helper tests with `CloudinaryListingImageManager` port tests; removed unused image persistence helper exports
  - files changed: `package.json`, `src/server/product-read-service.ts`, `src/server/product-read-service.test.ts`, `src/routes/api/products.$id.ts`, `src/routes/product/$id.tsx`, `src/data/product-repo.prisma.test.ts`, `src/domains/listings/infrastructure/listing-image-assets.ts`, `src/domains/listings/infrastructure/listing-image-assets.test.ts`, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused unit tests passed with bundled Node; `bun run typecheck` passed; touched-file Biome passed; full `bun run test:unit` passed with 190 tests and 18 gated DB tests skipped; sandboxed `bun run test:db` failed on local Postgres access but unsandboxed rerun with approval passed 18 DB tests
  - decisions made: keep `/api/products/$id` as temporary read compatibility but return proper HTTP status for missing reads; keep public lifecycle visibility in the product detail component so seller/admin edit reads can still use the shared API; keep product read behavior tests at the current Prisma repository boundary until Slice `4` query use cases exist; do not keep dead image helper exports just for tests
  - blockers or risks: product/listing reads still use product action/repository/API vocabulary and must move in Slice `4`; create-listing browser smoke still needs real Cloudinary config; moderation navigation warning and request logging issue remain; local smoke seed rows remain
  - exact next recommended task: begin Slice `4` listing query/read-model migration starting with listing detail and approved listing search
- Latest implementation session completed on 2026-06-18:
  - work completed: Slice `3` legacy product command cleanup completed; removed dead product command service exports from `src/actions/product.ts`; removed dead product command repository helpers from `src/data/product-repo.ts`; removed obsolete product status update schema/type from `src/lib/zod/product-validation.ts`; deleted unused `src/actions/product-image-assets.ts`; replaced product action tests with read-service compatibility coverage; added listing image asset infrastructure tests for bounded upload concurrency and cleanup behavior
  - files changed: `src/actions/product.ts`, `src/actions/product.test.ts`, `src/data/product-repo.ts`, `src/lib/zod/product-validation.ts`, `src/domains/listings/infrastructure/listing-image-assets.test.ts`, deleted `src/actions/product-image-assets.ts`, `ddd/progress.md`, `ddd/next-session.md`
  - tests/checks run: focused product/listing tests passed with bundled Node: 46 tests passed and 7 DB tests skipped; `bun run typecheck` passed; touched-file Biome passed; `bun run docs:check` passed after handoff update; sandboxed `bun run test:db` failed on local Postgres access but unsandboxed rerun with approval passed 14 DB tests; full `bun run test:unit` passed with 192 tests and 14 DB tests skipped; `git diff --check` passed
  - decisions made: old product command action/repository path is drained for Slice `3`; `src/actions/product.ts` remains temporary read compatibility only; image helper coverage belongs with listing infrastructure; do not reintroduce product command service/repo helpers or product command API handlers
  - blockers or risks: product/listing reads still use product vocabulary and must move in Slice `4`; create-listing browser smoke still needs real Cloudinary config; product detail route still throws after delete/withdraw not-found reads; moderation navigation warning and request logging issue remain; local smoke seed rows remain
  - exact next recommended task: fix or track the product detail not-found rendering error, then begin Slice `4` listing query/read-model migration starting with listing detail and approved listing search
- Latest implementation session completed on 2026-06-18:
  - work completed: Codex Desktop in-app browser smoke for migrated listing command delivery; seller update submitted through `updateListingFn`; seller unreferenced delete submitted through `deleteListingFn` and hard-deleted the row; seller referenced delete submitted through `deleteListingFn` and changed the row to `WITHDRAWN`; admin approve submitted through `moderateListingFn`; post-smoke DB verification confirmed expected listing states and seller notification; server logs showed listing command POSTs under `/_serverFn/...listing.functions...`; no legacy product command POST/PUT/DELETE was observed
  - files changed: `ddd/progress.md`, `ddd/next-session.md`; temporary ignored helper `tmp/ddd-browser-smoke.ts`
  - tests/checks run: focused listing command/domain/moderation tests passed with bundled Node, with DB tests skipped by default; `bun run typecheck` passed before smoke; Prisma migrate status passed against local Postgres; browser smoke passed for update/delete/withdraw/moderation; post-smoke DB verify script passed
  - decisions made: consider non-upload listing command delivery browser-smoked; keep create-listing browser smoke blocked until real Cloudinary config exists; keep product/listing reads as temporary compatibility until Slice `4`; next work remains Slice `3` cleanup, not Slice `4`
  - blockers or risks: create listing through `createListingFn` still needs real Cloudinary config; old product action/repository command helpers and old tests remain; post-delete/withdraw product detail route logs `TypeError: Cannot read properties of undefined (reading '0')`; moderation success still logs `Could not find match for from: /shop`; server-function request logging still misreports successful non-`Response` returns as status `500`; local smoke seed rows remain
  - exact next recommended task: delete or relocate dead legacy product command helpers/tests while preserving read compatibility, then run focused listing tests/typecheck/Biome/docs check and gated DB tests if local Postgres is available
- Latest implementation session completed on 2026-06-16:
  - work completed: active order server-function flow browser-smoked successfully; gated DB suite rerun; Slice `3` listing lifecycle started with `Product.listingStatus` bridge, `ModerateListing`, `CreateListing`, `UpdateListing`, and `RemoveListing` use cases; Prisma moderation and command repositories added; listing create/update/delete/moderate command callers moved to server functions; old moderation API route deleted; product API command handlers removed; decline marks `DECLINED`; referenced listing removal marks `WITHDRAWN`; listing service now supports dependency injection for real Prisma repositories plus fake image manager tests
  - files changed: `prisma/schema.prisma`, new listing-status migration, listing aggregate/tests, new `moderate-listing` and `manage-listing` use cases/tests, new Prisma moderation and command adapters, moved listing image asset infrastructure, new listing server service/functions, new listing service Prisma integration test, product query command callers, product repo/action status bridge updates, product types, product API read-only route changes, DB test script, route tree, `ddd/progress.md`, `ddd/next-session.md`; deleted `src/routes/api/products.pending.$id.ts` and stale product command-route test
  - tests/checks run: order browser smoke passed with no `/api/orders` requests; Prisma migrate deploy/generate/validate passed; listing moderation browser smoke passed with no `/api/products/pending` requests; focused listing command/moderation/domain/product tests passed; typecheck passed; touched-file Biome passed; full unit suite passed with 231 tests and DB tests skipped by default; gated DB suite now runs ordering plus listing Prisma integration serially and passed with 14 DB tests; build passed with existing large client chunk warning; docs check passed; `git diff --check` passed
  - decisions made: use `Product.listingStatus` as a transitional listing lifecycle bridge while keeping full `Product` -> `Listing` Prisma rename for a later schema slice; migrate listing commands to server functions and remove command API handlers rather than keeping compatibility shells; keep product/listing read APIs until Slice `4`; keep `isApproved` dual-written for compatibility; hard-delete only unreferenced listings and mark referenced listings `WITHDRAWN`
  - blockers or risks: seller listing create/update/delete server-function flow still needs browser smoke; create/update smoke may need real Cloudinary config; legacy product action command helpers and repository command helpers still exist as unused dead code for their old tests; product/listing reads still use product repository/API vocabulary; full Product-to-Listing Prisma rename remains pending; server-function request logging still misreports successful non-`Response` returns; moderation smoke observed non-fatal `navigate({ from: "/shop" })` warning; local smoke seed rows remain
  - exact next recommended task: browser-smoke seller listing command flows through `createListingFn`, `updateListingFn`, and `deleteListingFn` where environment allows, verify referenced removals become `WITHDRAWN`, then delete or relocate dead legacy product command helpers/tests
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
- Order server-function reads/status commands were browser-smoked successfully after route deletion.
- `Product.listingStatus` now bridges listing lifecycle status while `isApproved` remains compatibility state.
- Admin approve/decline moderation now calls `moderateListingFn`.
- The `/api/products/pending/$id` moderation route has been deleted.
- Declined listings are retained as `DECLINED`, not deleted.
- Pending moderation queries use `listingStatus = PENDING`; approved shop/search style queries use `listingStatus = APPROVED`.
- Slice `-1`, Slice `0`, and Slice `0.5` initial implementation are complete.
- The Slice `-1` customer order-by-id ownership characterization gap is fixed:
  - replacement target read coverage now lives in `src/server/order-service.test.ts` and `src/domains/ordering/application/order-read-models.test.ts`.
- The old action-level seller order-status ownership characterization was removed because it tested implementation details instead of the stable flow. Replacement behavior coverage now exists at the server-service/application boundary.
- DDD foundation folders exist under `src/domains`.
- Shared primitives exist under `src/domains/shared`.
- `Money` tests pass.
- `src/test/api-products-id-route.test.ts` was deleted after `/api/products/$id` became read-only.
- Transitional product money persistence exists:
  - `Product.priceCents`
  - `Product.currencyCode`
  - deterministic Float-to-cent backfill migration
  - product create/update dual-write
  - product reads prefer cents and fall back to legacy Float only when cents are absent
  - approved product price filters parse to cents and query with Float fallback

Latest checks:

- Browser smoke for active order server-function reads/status commands passed with no legacy `/api/orders` requests observed.
- `bun run test:db` passed after the order route/action cleanup.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate deploy` applied the listing-status migration.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma generate` passed.
- `bun run test:unit -- src/domains/listings/domain/listing.test.ts src/domains/listings/application/moderate-listing.test.ts src/actions/product.test.ts` passed: 75 tests.
- `bun run typecheck` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.
- `bunx biome check src/actions/product.ts src/data/product-repo.ts src/domains/listings/domain/listing.ts src/domains/listings/domain/listing.test.ts src/domains/listings/application/moderate-listing.ts src/domains/listings/application/moderate-listing.test.ts src/domains/listings/infrastructure/prisma-listing-moderation.ts src/lib/tanstack-query/product-queries.ts src/server/listing-service.ts src/server/listing.functions.ts src/types/product.ts src/routeTree.gen.ts` passed.
- `bun run test:unit` passed: 21 files passed, 1 DB integration file skipped by default; 223 tests passed, 7 skipped.
- `bun run test:db` passed after the listing-status migration.
- `bun run docs:check` passed.
- `bun run build` passed with the existing large client chunk warning.
- Browser smoke for admin listing approval/decline through `moderateListingFn` passed with no legacy `/api/products/pending` requests observed.
- `git diff --check` passed.
- `bun run test:unit -- src/domains/listings/application/manage-listing.test.ts src/domains/listings/application/moderate-listing.test.ts src/domains/listings/domain/listing.test.ts src/actions/product.test.ts` passed after listing command migration: 85 tests.
- `bun run typecheck` passed after listing command migration.
- `bunx biome check src/domains/listings/application/manage-listing.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/infrastructure/prisma-listing-commands.ts src/domains/listings/infrastructure/listing-image-assets.ts src/actions/product-image-assets.ts src/server/listing-service.ts src/server/listing.functions.ts src/lib/tanstack-query/product-queries.ts src/routes/api/products.ts 'src/routes/api/products.$id.ts' src/types/product.ts` passed after formatting.
- `bun run test:unit` passed after listing command migration: 21 files passed, 1 DB integration file skipped by default; 231 tests passed, 7 skipped.
- `bun run test:db` passed after listing command migration with sandbox escalation for localhost Postgres.
- `bun run build` passed after listing command migration with the existing large client chunk warning.
- `bun run docs:check` passed after listing command migration.
- `git diff --check` passed after listing command migration.

## Expected End State For Next Session

- Seller create/update/delete or withdraw flows are browser-smoked through listing server functions where environment allows.
- Command requests do not hit `/api/products` POST, `/api/products/$id` PUT/DELETE, or `/api/products/pending/$id`.
- Unused legacy product command action/repository helpers are removed or explicitly left with a documented reason.
- Admin moderation still approves/declines and notifies sellers; decline keeps the row as `DECLINED`.
- Buyer/seller list reads remain backed by target `Purchase` / `SellerOrder` read models through `listOrdersForCurrentUserFn`.
- Order detail reads remain backed by target `GetOrderDetail` through `getOrderDetailFn`.
- Seller status updates remain backed by target `ChangeSellerOrderStatus` through `changeSellerOrderStatusFn`.
- Existing checkout UX remains backed by the server-function `PlacePurchase` path.
- No `/api/orders` compatibility route, old order action layer, or old fake-order repo is reintroduced.
- `/api/products/pending/$id` is not reintroduced.
- `ddd/progress.md` updated with:
  - work completed
  - files changed
  - tests/checks run and results
  - decisions made
  - blockers or risks
- `ddd/next-session.md` updated with the exact next recommended task.
