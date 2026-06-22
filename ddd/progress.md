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
- Slice `2` buyer purchase history and seller-order dashboard read migration started on 2026-06-12.
- Slice `2` seller-order status lifecycle and target status update path started on 2026-06-12.
- Slice `2` target order detail reads for `/api/orders/$id` GET added on 2026-06-12.
- Slice `2` active order read/detail/status delivery moved to TanStack server functions on 2026-06-12.
- Slice `2` active order server-function flow browser smoke completed on 2026-06-16.
- Slice `3` listing lifecycle started on 2026-06-16 with listing-status bridging and server-function moderation.
- Slice `3` listing create/update/delete command migration to server functions added on 2026-06-16.
- Slice `3` browser smoke for migrated listing update/delete/withdraw/moderation command delivery completed on 2026-06-18.
- Slice `3` legacy product command action/repository cleanup completed on 2026-06-18.
- Slice `3` product read/test hardening completed on 2026-06-18.
- Slice `4` listing detail and approved listing search read-model migration started on 2026-06-18.
- Slice `4` seller listings and pending moderation queue read migration added on 2026-06-22.

## Latest Session Notes

- Continued Slice `4` listing query/read-model migration with TDD tracer bullets:
  - added `ListSellerListings` and `ListPendingModerationListings` use cases under `src/domains/listings/application`
  - extended `PrismaListingReadModels` with seller listing and pending moderation queue reads
  - moved `/api/products/seller` compatibility reads to `getSellerListingsForProductApi`
  - moved `/api/products/pending` compatibility reads to `getPendingModerationListingsForProductApi`
  - removed migrated seller and pending read helpers from `src/actions/product.ts` and `src/data/product-repo.ts`
  - moved seller and pending behavior coverage to DB-backed `prisma-listing-read-models.prisma.test.ts`
- Preserved compatibility behavior:
  - `/api/products/seller` keeps the existing product-compatible response shape for the seller settings UI
  - `/api/products/pending` keeps the existing product-compatible response shape for admin pending moderation UI/hooks
  - `isApproved` remains derived at the product API compatibility boundary from `listingStatus`
- TDD test choices:
  - added behavior-level Prisma tests for seller listings and pending moderation queue reads
  - avoided new internal collaborator/call-count tests for these reads
  - trimmed old product action/repository tests after the replacement listing read behavior was green

- Started Slice `4` listing query/read-model migration with TDD tracer bullets:
  - added `GetListingDetails` and `SearchApprovedListings` use cases under `src/domains/listings/application`
  - added listing read DTOs under `src/domains/listings/dto`
  - added `PrismaListingReadModels` under `src/domains/listings/infrastructure`
  - moved `/api/products/$id` detail compatibility to `getListingDetailsProductResponse`
  - moved `/api/products` approved search compatibility to `getApprovedListingsForProductApi`
  - deleted `src/server/product-read-service.ts` and its test after moving behavior to `src/server/listing-read-service.ts`
  - removed migrated detail/search helpers from `src/actions/product.ts`
  - removed migrated detail/search helpers from `src/data/product-repo.ts`
  - moved DB-backed approved search and detail coverage to `prisma-listing-read-models.prisma.test.ts`
- Preserved compatibility behavior:
  - `/api/products/$id` still returns HTTP `404` with `"Product not found"` for missing reads
  - product detail compatibility reads now return HTTP `404` with `"Product not found"` for non-`APPROVED` listing statuses at the server read boundary
  - `/api/products` still accepts existing product query params and returns the same product-compatible read shape
- Tightened the new listing read boundary after the tracer bullet:
  - moved approved-listing product API query parsing into the listings DTO layer
  - typed listing search category/condition before the Prisma adapter, removing infrastructure enum casts
  - made product API compatibility response mapping explicit in `src/server/listing-read-service.ts`
  - added invalid pagination/filter coverage so bad category/condition values fail as product API validation errors before hitting Prisma
- Post-review hardening:
  - checkout listing reservation now uses `listingStatus = APPROVED` as the orderability and guarded stock-update authority instead of the legacy `isApproved` flag
  - internal `ListingReadModel` no longer carries `isApproved`; the temporary product API compatibility mapper derives it from `listingStatus`
  - raw listing detail infrastructure can still load non-public listing statuses for future seller/admin reads, but the product detail compatibility API is public-facing and hides non-`APPROVED` statuses
  - product read action tests no longer mock the product repository happy paths; cart, seller, count, and recent success coverage moved to `src/actions/product.prisma.test.ts` through the real Prisma repository
  - the new product action Prisma test uses fixed `product-action-*` fixture IDs and only cleans up those owned rows
- TDD test review follow-up:
  - deleted the low-value `src/domains/listings/application/listing-read-models.test.ts` wrapper test; behavior remains covered through the product API service and Prisma read-model tests
  - reviewed the remaining created/modified test files under the TDD criteria and found no more obvious low-value tests to delete
  - tightened `src/server/listing-read-service.test.ts` so approved product API query mapping captures and asserts the parsed listing search query directly instead of hiding mismatches behind conditional fake return data

## Files Changed In Latest Session

- `package.json`
- `src/domains/listings/application/listing-read-models.ts`
- `src/domains/listings/dto/listing-read-model.ts`
- `src/domains/listings/infrastructure/prisma-listing-read-models.ts`
- `src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`
- `src/server/listing-read-service.ts`
- `src/server/listing-read-service.test.ts`
- deleted `src/server/product-read-service.ts`
- deleted `src/server/product-read-service.test.ts`
- `src/routes/api/products.ts`
- `src/routes/api/products.$id.ts`
- `src/routes/api/products.seller.ts`
- `src/routes/api/products.pending.ts`
- `src/actions/product.ts`
- `src/actions/product.test.ts`
- `src/actions/product.prisma.test.ts`
- `src/data/product-repo.ts`
- `src/data/product-repo.prisma.test.ts`
- `src/domains/ordering/infrastructure/prisma-listings-for-purchase.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Latest Session

- TDD red/green cycles run with bundled Node for `src/server/listing-read-service.test.ts`.
- Focused unit suite after test cleanup passed with bundled Node: `src/actions/product.test.ts`, `src/actions/product.prisma.test.ts`, `src/server/listing-read-service.test.ts`, `src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`, `src/data/product-repo.prisma.test.ts`, and `src/domains/ordering/application/place-purchase.prisma.test.ts` with 11 tests passed and 18 gated DB tests skipped.
- After the query-capture test refactor, `src/server/listing-read-service.test.ts` passed with bundled Node: 8 tests passed.
- Post-review focused tests passed with bundled Node: listing read service tests, listing read Prisma test file skipped by default, `PlacePurchase` unit tests, and `PlacePurchase` Prisma test file skipped by default.
- `bun run typecheck` passed with bundled Node.
- Touched-file `bunx biome check` passed after applying safe fixes.
- Touched-file `bunx biome check src/server/listing-read-service.test.ts` passed after the query-capture test refactor.
- Earlier gated DB suite passed with bundled Node before the product action integration file was added: 4 files passed, 22 DB tests passed.
- After the product action test split, sandboxed focused DB execution still failed on local Postgres access, then `src/actions/product.prisma.test.ts` passed with local DB access: 3 DB tests passed.
- Seller/pending read migration focused tests passed:
  - `bun run typecheck`
  - `bun run test:unit -- src/server/listing-read-service.test.ts src/actions/product.test.ts`
  - `RUN_DB_TESTS=1 bun run test:unit -- --no-file-parallelism src/actions/product.prisma.test.ts src/data/product-repo.prisma.test.ts src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`
  - touched-file `bunx biome check`

## Decisions In Latest Session

- Keep `/api/products` and `/api/products/$id` as product-route compatibility shells while moving their read behavior to listing query use cases.
- Keep client query wrapper names like `getApprovedProducts` for now because the UI still uses product route vocabulary; the important Slice `4` boundary is that routes no longer call `src/actions/product.ts`.
- Keep `src/actions/product.ts` as a narrowed temporary compatibility layer for cart-details, counts, and recent reads only.
- Seller listings and pending moderation queue reads now belong to listing read models, not product actions/repositories.
- Move active approved-search DB coverage from `src/data/product-repo.prisma.test.ts` to `PrismaListingReadModels`; the old product repository no longer owns approved search/detail reads.
- Keep product-compatible response mapping in the server read service during the migration rather than letting product-shaped DTOs become the listings application contract.
- Treat `listingStatus` as the orderability source of truth for both shop/search visibility and checkout reservation; `isApproved` remains compatibility output only where legacy product clients still expect it.
- Keep raw listing detail infrastructure capable of loading non-public listing statuses for future seller/admin reads, but make the product detail compatibility API public-facing and hide non-`APPROVED` statuses with HTTP `404`.

## Risks / Follow-Ups From Latest Session

- Remaining product/listing read routes still using `src/actions/product.ts`: cart details, counts, and recent reads.
- Product/listing DTO naming is still compatibility-heavy in client-facing types and hooks.
- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Existing non-fatal moderation navigation warning and misleading server-function request logging remain.
- Smoke seed rows remain in local development data.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 3 Product Read/Test Hardening Session Notes

- Fixed the product detail not-found rendering gap:
  - `/api/products/$id` now returns HTTP `404` for missing/deleted product reads instead of a successful error payload.
  - public product detail now shows the existing "Product not found" state for non-`APPROVED` lifecycle statuses, preserving edit/API compatibility for seller/admin flows.
  - added `src/server/product-read-service.ts` and focused response tests for the HTTP boundary.
- Added DB-backed product read behavior coverage:
  - approved listing reads include only `listingStatus = APPROVED`
  - pending moderation reads and pending counts exclude `DECLINED` and `WITHDRAWN`
  - cent-based price filters still include legacy Float fallback rows
  - recent products include only approved listings
- Replaced dead image-helper test coverage with production image-manager port coverage:
  - removed unused create/replace/delete image helper exports from `src/domains/listings/infrastructure/listing-image-assets.ts`
  - `listing-image-assets.test.ts` now targets `CloudinaryListingImageManager`, bounded upload concurrency, failed-upload cleanup, and best-effort cleanup behavior.

## Files Changed In Previous Slice 3 Product Read/Test Hardening Session

- `package.json`
- `src/server/product-read-service.ts`
- `src/server/product-read-service.test.ts`
- `src/routes/api/products.$id.ts`
- `src/routes/product/$id.tsx`
- `src/data/product-repo.prisma.test.ts`
- `src/domains/listings/infrastructure/listing-image-assets.ts`
- `src/domains/listings/infrastructure/listing-image-assets.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 3 Product Read/Test Hardening Session

- Focused unit tests passed with bundled Node: 15 tests passed and 4 gated DB tests skipped across `src/server/product-read-service.test.ts`, `src/actions/product.test.ts`, `src/domains/listings/infrastructure/listing-image-assets.test.ts`, and `src/data/product-repo.prisma.test.ts`.
- `bun run typecheck` passed with bundled Node.
- Touched-file `bunx biome check` passed.
- Full `bun run test:unit` passed with bundled Node: 23 files passed, 3 gated DB files skipped; 190 tests passed, 18 skipped.
- Sandboxed `bun run test:db` failed on Prisma cleanup because local Postgres access was blocked by sandboxing; unsandboxed rerun with approval passed: 18 DB tests passed.

## Decisions In Previous Slice 3 Product Read/Test Hardening Session

- Keep `/api/products/$id` as a temporary read compatibility route for Slice `4`, but return proper HTTP status for missing product reads.
- Keep product detail lifecycle visibility in the public route component so seller/admin edit reads can still use the shared product detail API during the migration.
- Treat product read behavior coverage as DB-backed integration coverage at the current compatibility repository boundary until Slice `4` introduces listing query use cases/read models.
- Do not keep dead image persistence helper exports just to preserve tests; image storage behavior is covered through the `ListingImageManagerPort` implementation.

## Risks / Follow-Ups From Previous Slice 3 Product Read/Test Hardening Session

- Product/listing reads still use product action/repository/API vocabulary; Slice `4` should move search/details/seller/pending reads to listing read models.
- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Fix or track the non-fatal moderation success navigation warning from `navigate({ from: "/shop" })`.
- Existing misleading request logging remains: successful server-function returns that are not `Response` objects can be logged as status `500`.
- Smoke seed rows remain in local development data.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 3 Product Command Cleanup Session Notes

- Continued Slice `3` cleanup after migrated listing command browser smoke:
  - removed dead legacy product command service exports from `src/actions/product.ts`
  - removed dead product command repository helpers from `src/data/product-repo.ts`
  - removed the obsolete product status update schema/type from `src/lib/zod/product-validation.ts`
  - deleted the unused `src/actions/product-image-assets.ts` compatibility re-export
  - replaced `src/actions/product.test.ts` with read-service compatibility coverage only
  - added `src/domains/listings/infrastructure/listing-image-assets.test.ts` for upload bounded-concurrency and image cleanup behavior that belongs with listing infrastructure
- Preserved temporary product/listing read compatibility:
  - current product read API routes still use `src/actions/product.ts` or existing read repository helpers
  - active create/update/delete/moderate client command wrappers still call listing server functions from `src/lib/tanstack-query/product-queries.ts`
- Left `src/actions/product.ts` as a temporary read compatibility layer until Slice `4`; it no longer contains listing/product command behavior.

## Files Changed In Previous Slice 3 Product Command Cleanup Session

- `src/actions/product.ts`
- `src/actions/product.test.ts`
- `src/data/product-repo.ts`
- `src/lib/zod/product-validation.ts`
- `src/domains/listings/infrastructure/listing-image-assets.test.ts`
- deleted `src/actions/product-image-assets.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 3 Product Command Cleanup Session

- `bun run test:unit -- src/actions/product.test.ts src/domains/listings/infrastructure/listing-image-assets.test.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/application/moderate-listing.test.ts src/domains/listings/domain/listing.test.ts src/server/listing-service.prisma.test.ts` passed with bundled Node: 46 tests passed, 7 DB tests skipped.
- `bun run typecheck` passed with bundled Node.
- Touched-file `bunx biome check` passed after formatting the rewritten tests.
- `bun run docs:check` passed after this handoff update.
- Sandboxed `bun run test:db` failed on the first Prisma cleanup call because local Postgres access was blocked by sandboxing; rerunning unsandboxed with approval passed: 14 DB tests passed.
- Full `bun run test:unit` passed with bundled Node: 22 files passed, 2 DB integration files skipped; 192 tests passed, 14 skipped.
- `git diff --check` passed.

## Decisions In Previous Slice 3 Product Command Cleanup Session

- Treat Slice `3` product command cleanup as complete for the old action/repository command helpers.
- Keep `src/actions/product.ts` only as temporary read compatibility until Slice `4` drains listing/product reads into listing query use cases/read models.
- Keep image upload/compression/cleanup behavior behind listing infrastructure and cover those helpers in `src/domains/listings/infrastructure/listing-image-assets.test.ts`.
- Do not reintroduce old product action command services, product command repository helpers, `/api/products` POST, `/api/products/$id` PUT/DELETE, or `/api/products/pending/$id`.

## Risks / Follow-Ups From Previous Slice 3 Product Command Cleanup Session

- Product/listing reads still use product action/repository/API vocabulary; Slice `4` should move search/details/seller/pending reads to listing read models.
- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Fix or track the non-fatal moderation success navigation warning from `navigate({ from: "/shop" })`.
- Existing misleading request logging remains: successful server-function returns that are not `Response` objects can be logged as status `500`.
- Smoke seed rows remain in local development data.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 3 Browser Smoke Session Notes

- Browser-smoked migrated listing command delivery in the Codex Desktop in-app browser against local Postgres:
  - seller login worked with seeded smoke seller data
  - seller update submitted through `updateListingFn` and changed the seeded listing name
  - seller delete of an unreferenced seeded listing submitted through `deleteListingFn` and hard-deleted the row
  - seller delete of a referenced seeded listing submitted through `deleteListingFn` and changed the row to `WITHDRAWN`
  - admin login worked with seeded smoke admin data
  - admin approval submitted through `moderateListingFn` and changed the pending row to `APPROVED`
  - server logs showed migrated listing command POSTs under `/_serverFn/...listing.functions...`
  - no legacy product command route POST/PUT/DELETE was observed during the command actions
- Post-smoke DB verification confirmed:
  - updated listing: `name = "Smoke Updated Listing Via Browser"`, `listingStatus = PENDING`, `isApproved = false`
  - unreferenced delete listing no longer exists
  - referenced listing: `listingStatus = WITHDRAWN`, `isApproved = false`
  - moderated listing: `listingStatus = APPROVED`, `isApproved = true`
  - seller approval notification was created
- Create-listing browser smoke was not completed because this local environment has only `DATABASE_URL`; no real Cloudinary upload configuration is available. The dev server used dummy Cloudinary env values so non-upload command modules could load.
- Browser smoke surfaced or reconfirmed these non-fatal issues:
  - after delete/withdraw, the product detail route logs `TypeError: Cannot read properties of undefined (reading '0')` from `src/routes/product/$id.tsx`
  - moderation success still logs `Could not find match for from: /shop`
  - request logging still marks successful server-function returns as status `500`
- Temporary ignored smoke helper/data used:
  - `tmp/ddd-browser-smoke.ts`
  - local smoke users/listings with `smoke-*-ddd-browser` IDs remain in local development data

## Files Changed In Previous Slice 3 Browser Smoke Session

- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 3 Browser Smoke Session

- Codex Desktop in-app browser smoke passed for listing update, unreferenced delete, referenced withdraw, and admin approve command delivery.
- `PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run test:unit -- src/domains/listings/application/manage-listing.test.ts src/domains/listings/application/moderate-listing.test.ts src/domains/listings/domain/listing.test.ts src/server/listing-service.prisma.test.ts` passed: 29 tests passed, 7 DB tests skipped.
- `bun run typecheck` passed before the browser smoke.
- `PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bunx prisma migrate status` passed with local Postgres: database schema is up to date.
- `PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun --bun tmp/ddd-browser-smoke.ts verify` passed and confirmed expected DB state.

## Decisions In Previous Slice 3 Browser Smoke Session

- Treat the migrated listing command delivery as browser-smoked for non-upload command paths.
- Keep successful create-listing browser smoke blocked until real Cloudinary upload configuration is available.
- Do not start Slice `4` yet; the next implementation move remains Slice `3` cleanup of dead legacy product command helpers/tests, while preserving read compatibility.

## Risks / Follow-Ups From Previous Slice 3 Browser Smoke Session

- Create listing through `createListingFn` still needs browser smoke in an environment with real Cloudinary config.
- Legacy product action command helpers and repository command helpers still exist as unused compatibility/dead code for their old tests; remove or relocate them next.
- Product/listing reads still use product repository/API vocabulary; Slice `4` should move search/details/seller/pending reads to listing read models.
- Fix or track the post-delete product detail error from `src/routes/product/$id.tsx`.
- Fix or track the non-fatal moderation success navigation warning from `navigate({ from: "/shop" })`.
- Existing misleading request logging remains: successful server-function returns that are not `Response` objects can be logged as status `500`.
- Smoke seed rows remain in local development data.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 3 Command Migration Session Notes

- Browser-smoked the active order server-function flow with local seeded customer/seller data:
  - customer settings purchase history loaded through `listOrdersForCurrentUserFn`
  - seller settings sales dashboard loaded through `listOrdersForCurrentUserFn`
  - seller moved `NEW -> PROCESSING`
  - seller was blocked from `PROCESSING -> SHIPPED` without a tracking number
  - seller moved `PROCESSING -> SHIPPED` after entering a tracking number
  - seller moved `SHIPPED -> DELIVERED`
  - no legacy `/api/orders` requests were observed
- Reran the gated local Postgres DB suite after the order route/action cleanup; it passed.
- Started Slice `3` listing lifecycle with a narrow moderation/status bridge rather than a full Prisma table rename:
  - added `ListingStatus` to `Product` as a transitional status column
  - backfilled `listingStatus` from `isApproved`
  - expanded the `Listing` aggregate with moderation and withdrawal lifecycle behavior
  - added `ModerateListing` application use case with explicit `Actor` authorization
  - added Prisma moderation repository/notifier infrastructure
  - added `moderateListingFn` server-function delivery
  - moved admin approve/decline mutation callers from `/api/products/pending/$id` to `moderateListingFn`
  - deleted the legacy `/api/products/pending/$id` route
  - changed decline behavior to mark listings `DECLINED` and notify the seller instead of deleting the row
  - switched pending/approved product queries to `listingStatus` while keeping `isApproved` as compatibility state
- Browser-smoked admin listing moderation with local seeded admin/seller/listings:
  - approve command returned 200 through `moderateListingFn`
  - decline command returned 200 through `moderateListingFn`
  - no legacy `/api/products/pending` request was observed
  - approved listing ended as `listingStatus = APPROVED`, `isApproved = true`
  - declined listing ended as `listingStatus = DECLINED`, `isApproved = false`
  - seller notifications were created for both moderation outcomes
- Continued Slice `3` by moving active listing create/update/delete command delivery to TanStack server functions:
  - added `CreateListing`, `UpdateListing`, and `RemoveListing` application use cases with explicit `Actor` authorization
  - added an image-manager port so upload/compression/cleanup stays out of domain code
  - moved the Cloudinary image asset helper into listings infrastructure with an action-layer compatibility re-export
  - added `PrismaListingCommandRepository`
  - added `createListingFn`, `updateListingFn`, and `deleteListingFn`
  - changed React Query product command helpers to call listing server functions instead of `/api/products` command routes
  - removed POST from `/api/products`
  - removed PUT/DELETE from `/api/products/$id`
  - deleted the stale `/api/products/$id` command-route test
  - implemented safe removal semantics: unreferenced listings hard-delete and clean images; referenced listings become `WITHDRAWN` and keep images
- Added vertical listing service Prisma integration coverage:
  - starts at the delivery-facing listing service boundary
  - exercises service mapping, application use cases, Prisma infrastructure, and real local DB persistence
  - injects real Prisma repositories plus a fake image manager to avoid Cloudinary/network calls
  - covers create, seller update, admin update, moderation notifications, unreferenced hard delete, referenced `WITHDRAWN`, and unauthorized seller mutation
- Updated `bun run test:db` to run ordering and listing Prisma integration files serially with `--no-file-parallelism`, because both files share and clean the same local database.

## Files Changed In Latest Session

- `prisma/schema.prisma`
- `prisma/migrations/20260616150000_add_listing_status_to_product/migration.sql`
- `src/actions/product-image-assets.ts`
- `src/actions/product.ts`
- `src/data/product-repo.ts`
- `src/domains/listings/domain/listing.ts`
- `src/domains/listings/domain/listing.test.ts`
- `src/domains/listings/application/manage-listing.ts`
- `src/domains/listings/application/manage-listing.test.ts`
- `src/domains/listings/application/moderate-listing.ts`
- `src/domains/listings/application/moderate-listing.test.ts`
- `src/domains/listings/infrastructure/listing-image-assets.ts`
- `src/domains/listings/infrastructure/prisma-listing-commands.ts`
- `src/domains/listings/infrastructure/prisma-listing-moderation.ts`
- `src/server/listing-service.ts`
- `src/server/listing-service.prisma.test.ts`
- `src/server/listing.functions.ts`
- `src/lib/tanstack-query/product-queries.ts`
- `src/types/product.ts`
- `package.json`
- `src/routeTree.gen.ts`
- `src/routes/api/products.ts`
- `src/routes/api/products.$id.ts`
- deleted `src/routes/api/products.pending.$id.ts`
- deleted `src/test/api-products-id-route.test.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Latest Session

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
- `bun run build` passed with the existing large client chunk warning.
- Browser smoke for admin listing approval/decline through `moderateListingFn` passed with no legacy `/api/products/pending` requests observed.
- `git diff --check` passed.
- `bun run docs:check` passed.
- `bun run test:unit -- src/domains/listings/application/manage-listing.test.ts src/domains/listings/application/moderate-listing.test.ts src/domains/listings/domain/listing.test.ts src/actions/product.test.ts` passed: 85 tests.
- `bun run typecheck` passed after listing command migration.
- `bunx biome check src/domains/listings/application/manage-listing.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/infrastructure/prisma-listing-commands.ts src/domains/listings/infrastructure/listing-image-assets.ts src/actions/product-image-assets.ts src/server/listing-service.ts src/server/listing.functions.ts src/lib/tanstack-query/product-queries.ts src/routes/api/products.ts 'src/routes/api/products.$id.ts' src/types/product.ts` passed after formatting.
- `bun run test:unit` passed after listing command migration: 21 files passed, 1 DB integration file skipped by default; 231 tests passed, 7 skipped.
- `bun run test:db` passed with sandbox escalation for localhost Postgres after listing command migration.
- `bun run build` passed after listing command migration with the existing large client chunk warning.
- `bun run docs:check` passed after listing command migration.
- `git diff --check` passed after listing command migration.
- `bun run test:unit -- src/server/listing-service.prisma.test.ts` skipped cleanly without `RUN_DB_TESTS=1`.
- `bun run test:db` passed after adding listing service integration coverage: 2 files, 14 DB tests.
- `bun run test:unit` passed after adding listing service integration coverage: 21 files passed, 2 DB integration files skipped by default; 231 tests passed, 14 skipped.
- `bun run typecheck` passed after adding listing service integration coverage.
- `bunx biome check src/server/listing-service.ts src/server/listing-service.prisma.test.ts package.json` passed.
- `git diff --check` passed after adding listing service integration coverage.

## Decisions In Latest Session

- Use `Product.listingStatus` as the Slice `3` bridge toward listing lifecycle semantics while leaving the full `Product` -> `Listing` Prisma rename for a planned schema slice.
- Treat admin listing moderation as the first migrated listing command because it has a narrow surface and directly exercises the new lifecycle status.
- Delete the old moderation API route once the admin caller moved to `moderateListingFn`; do not keep compatibility API shells for migrated commands.
- Delete product API command handlers once create/update/delete callers moved to `createListingFn`, `updateListingFn`, and `deleteListingFn`; keep read API routes until Slice `4`.
- Keep `isApproved` as dual-written compatibility state until old consumers are drained.
- Interpret legacy status count helpers as approved-vs-pending only; declined rows no longer count as pending.
- Use `WITHDRAWN` instead of hard delete when a listing has legacy order items, target seller-order item snapshots, reviews, or favorites.
- Leave broad product/listing read APIs in place until Slice `4` migrates read models.
- Make Slice `4` explicitly responsible for draining listing/product read paths from `src/actions/product.ts`; Slice `4` is not complete while listing/product reads still use the action layer.
- Use vertical service-boundary Prisma integration tests for migrated listing commands where persistence semantics matter; keep Cloudinary behind an injectable fake image manager in those tests.

## Risks / Follow-Ups From Latest Session

- Seller listing create/update/delete server-function flow still needs browser smoke. Image upload paths may require real Cloudinary configuration; delete/withdraw can be smoked with seeded local data.
- Legacy product action command helpers and repository command helpers still exist as unused compatibility/dead code for their old tests; remove or relocate them after browser smoke confirms the server-function command path.
- Product/listing reads still use product repository/API vocabulary; Slice `4` should move search/details/seller/pending reads to listing read models.
- The full Prisma persistence vocabulary rename from `Product` to `Listing` remains pending.
- Existing misleading request logging remains: successful server-function returns that are not `Response` objects can be logged as status `500`.
- Browser smoke observed a non-fatal moderation success navigation warning from `navigate({ from: "/shop" })`; track or fix with the existing router-warning follow-ups.
- Smoke seed rows remain in local development data.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 2 Server-Function Order Session Notes

- Committed the Slice `2` seller-order status lifecycle migration as `0700fcb` with message `feat: add seller order status lifecycle`.
- Migrated target order detail reads into the ordering read-model layer:
  - customers read purchase detail by `Purchase.id`
  - sellers read seller-order detail by `SellerOrder.id`
  - admins can read either purchase or seller-order detail by id
- Added `GetOrderDetail` application use case with explicit `Actor` authorization and not-found behavior that does not expose another user's order existence.
- Extended `PrismaOrderReadModels` with target detail queries over `Purchase` and `SellerOrder`.
- Added `src/server/order-service.ts` as the server-function delivery helper for active order reads, detail reads, and seller-order status changes.
- Added TanStack server functions:
  - `listOrdersForCurrentUserFn`
  - `getOrderDetailFn`
  - `changeSellerOrderStatusFn`
- Updated order query/mutation callers to use server functions instead of `/api/orders`.
- Added seller settings status controls for `NEW -> PROCESSING`, `PROCESSING -> SHIPPED` with tracking number, `SHIPPED -> DELIVERED`, and cancelable seller states.
- Removed the legacy order API route files:
  - `src/routes/api/orders.ts`
  - `src/routes/api/orders.seller.ts`
  - `src/routes/api/orders.$id.ts`
- Removed the old compatibility action/repo/fake-order helper layer:
  - `src/actions/order.ts`
  - `src/actions/order.test.ts`
  - `src/data/order.repo.ts`
  - `src/lib/zod/order-validation.ts`
  - `src/utils/generate-tracking-number.ts`
  - `src/utils/transform-order-query-response.ts`
- Regenerated `src/routeTree.gen.ts` after deleting the order API routes.
- Added focused server-service tests for list reads, detail reads, hidden unauthorized detail reads, tracking-number validation, and seller status command execution.

## Files Changed In Previous Slice 2 Server-Function Order Session

- `src/domains/ordering/application/order-read-models.ts`
- `src/domains/ordering/application/order-read-models.test.ts`
- `src/domains/ordering/infrastructure/prisma-order-read-models.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `src/server/order-service.ts`
- `src/server/order-service.test.ts`
- `src/server/order.functions.ts`
- `src/lib/tanstack-query/orders-queries.ts`
- `src/hooks/use-get-orders.ts`
- `src/routes/settings/-components/settings-orders-section.tsx`
- `src/types/order.ts`
- `src/routeTree.gen.ts`
- deleted `src/actions/order.ts`
- deleted `src/actions/order.test.ts`
- deleted `src/data/order.repo.ts`
- deleted `src/lib/zod/order-validation.ts`
- deleted `src/routes/api/orders.ts`
- deleted `src/routes/api/orders.seller.ts`
- deleted `src/routes/api/orders.$id.ts`
- deleted `src/utils/generate-tracking-number.ts`
- deleted `src/utils/transform-order-query-response.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 2 Server-Function Order Session

- `bun run test:unit -- src/server/order-service.test.ts src/server/place-purchase-service.test.ts src/domains/ordering/application/change-seller-order-status.test.ts src/actions/order.test.ts` passed before deleting the legacy action layer: 4 files, 20 tests.
- `bun run test:unit -- src/server/order-service.test.ts src/server/place-purchase-service.test.ts src/domains/ordering/application/order-read-models.test.ts src/domains/ordering/application/change-seller-order-status.test.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed after deleting the order API/action/repo layer: 4 files passed, 1 DB integration file skipped by default; 37 tests passed, 7 skipped.
- `bun run typecheck` passed.
- `bunx biome check src/server/order-service.ts src/server/order-service.test.ts src/server/order.functions.ts src/lib/tanstack-query/orders-queries.ts src/hooks/use-get-orders.ts src/routes/settings/-components/settings-orders-section.tsx src/types/order.ts src/routeTree.gen.ts src/domains/ordering/application/order-read-models.ts src/domains/ordering/application/order-read-models.test.ts src/domains/ordering/infrastructure/prisma-order-read-models.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed.
- `bun run test:unit` passed: 20 files passed, 1 DB integration file skipped by default; 208 tests passed, 7 skipped.
- `bun run docs:check` passed.
- `bun run build` passed with the existing large client chunk warning.

## Decisions In Previous Slice 2 Server-Function Order Session

- Interpret detail IDs by actor role:
  - customer: `Purchase.id`
  - seller: `SellerOrder.id`
  - admin: either `Purchase.id` or `SellerOrder.id`
- Return not found for unauthorized customer/seller detail reads so the target read path does not disclose ownership boundaries.
- Use TanStack server functions as the active delivery path for order list reads, detail reads, and seller-order status commands.
- Delete the old `/api/orders` route family instead of preserving compatibility shells once read/status callers moved to server functions.
- Delete `src/actions/order.ts` and `src/data/order.repo.ts` rather than keeping dead fake-order compatibility code.
- Keep the UI display field name `trackingNumber` as a temporary `OrderResponse` compatibility field, but seller `SHIPPED` commands now require an actual seller tracking number.

## Risks / Follow-Ups From Previous Slice 2 Server-Function Order Session

- No browser smoke was run yet for the new seller status controls or server-function order reads.
- Local browser smoke was attempted, but `bun run dev` failed on an internal framework port and `vite preview` kept scanning occupied ports; no dev/preview server was left running.
- The gated local Postgres integration test was not rerun after route/action cleanup in this session.
- Existing follow-ups remain: non-fatal add-to-cart router warning from `src/components/product-actions.tsx` and misleading server-function request logging for non-`Response` returns.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 2 Status Lifecycle Session Notes

- Committed the Slice `2` read-model migration as `7f72621` with message `feat: add ordering read models`.
- Added seller-order lifecycle behavior to the `SellerOrder` domain model:
  - reconstitution from persistence
  - `process()`
  - `ship(trackingNumber)`
  - `deliver()`
  - `cancel(actor)`
  - `SellerOrderStatusChanged` domain events
- Added `ChangeSellerOrderStatus` application use case:
  - uses explicit `Actor`
  - blocks sellers from changing other sellers' `SellerOrder`
  - allows customers to cancel only seller orders from their own purchases
  - allows admins under the current admin policy
  - requires a tracking number before shipping
  - rejects invalid domain transitions
- Added `PrismaSellerOrderStatusRepository` to load target `SellerOrder` rows with item snapshots and purchase customer snapshots, then persist status/tracking changes.
- Updated legacy `/api/orders/$id` PUT compatibility delivery:
  - interprets the path id as `SellerOrder.id` for status updates
  - delegates to `ChangeSellerOrderStatus`
  - accepts the old raw-string JSON body and an object body with optional `trackingNumber`
- Removed the action-level seller status ownership characterization because it asserted implementation details instead of the stable behavior flow.
- Deferred replacement seller-status delivery coverage until the whole status-change flow is sliced through the stable server-function/application boundary.
- Kept target authorization coverage in the `ChangeSellerOrderStatus` use-case tests.
- Added gated local Postgres integration coverage for target seller-order status updates.

## Files Changed In Previous Slice 2 Status Lifecycle Session

- `src/domains/ordering/domain/seller-order.ts`
- `src/domains/ordering/domain/seller-order.test.ts`
- `src/domains/ordering/application/change-seller-order-status.ts`
- `src/domains/ordering/application/change-seller-order-status.test.ts`
- `src/domains/ordering/infrastructure/prisma-seller-order-status-repository.ts`
- `src/domains/ordering/application/place-purchase.prisma.test.ts`
- `src/data/order.repo.ts`
- `src/actions/order.ts`
- `src/actions/order.test.ts`
- `src/routes/api/orders.$id.ts`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 2 Status Lifecycle Session

- `bun run test:unit -- src/domains/ordering/domain/seller-order.test.ts src/domains/ordering/application/change-seller-order-status.test.ts src/actions/order.test.ts src/domains/ordering/application/place-purchase.prisma.test.ts` passed: 3 files passed, 1 DB integration file skipped by default; 26 tests passed, 7 skipped.
- `bun run typecheck` passed.
- `bunx biome check src/domains/ordering/domain/seller-order.ts src/domains/ordering/domain/seller-order.test.ts src/domains/ordering/application/change-seller-order-status.ts src/domains/ordering/application/change-seller-order-status.test.ts src/domains/ordering/infrastructure/prisma-seller-order-status-repository.ts src/domains/ordering/application/place-purchase.prisma.test.ts src/data/order.repo.ts src/actions/order.ts src/actions/order.test.ts 'src/routes/api/orders.$id.ts'` passed after `--write` formatting.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed after sandbox escalation: 1 file, 7 tests.
- `bun run test:unit` passed: 20 files passed, 1 DB integration file skipped by default; 199 tests passed, 7 skipped.
- `bun run docs:check` passed.

## Decisions In Previous Slice 2 Status Lifecycle Session

- Treat `/api/orders/$id` PUT as a compatibility delivery shell for target `SellerOrder.id` status updates.
- Keep `/api/orders/$id` GET on the legacy `Order` detail path until a dedicated purchase/seller-order detail read model is migrated.
- Keep `PENDING` as an invalid target command status; the target seller-order lifecycle accepts `PROCESSING`, `SHIPPED`, `DELIVERED`, and `CANCELED` commands.
- Require `trackingNumber` for `SHIPPED`; the current UI/query helper still sends a raw status string, so shipping needs UI/API caller polish before exposing that transition broadly.
- Persist status/tracking only in the repository for now; domain events are captured by the use case for future notification/outbox handling but are not yet dispatched.
- Do not add route-level seller status flow tests while `/api/orders/$id` is a temporary compatibility route; add behavior coverage when the stable server-function/application flow exists.

## Risks / Follow-Ups From Previous Slice 2 Status Lifecycle Session

- Seller status UI may need a tracking-number input before sellers can successfully command `SHIPPED`.
- Legacy `/api/orders/$id` GET still reads old `Order` / `OrderItem`; purchase detail/admin target reads remain for a follow-up.
- Full seller status delivery coverage still needs to be added after the stable server-function/application flow is sliced out.
- No browser smoke was run for seller status updates in this session.
- Existing follow-ups remain: non-fatal add-to-cart router warning from `src/components/product-actions.tsx`, misleading server-function request logging for non-`Response` returns, and old `/api/orders` POST compatibility cleanup.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 2 Read-Model Session Notes

- Started Slice `2` read-model migration for buyer purchase history and seller-order dashboard reads.
- Added ordering read DTOs for target purchase/seller-order list rows and the approved buyer-facing summary statuses.
- Added `ListBuyerPurchaseHistory` and `ListSellerOrderDashboard` use cases:
  - use explicit `Actor`
  - enforce customer-only purchase history reads
  - enforce seller/admin-only seller-order dashboard reads
  - derive buyer-facing purchase summary status from `Purchase.paymentStatus`, `Purchase.status`, and `SellerOrder.status[]`
- Added `PrismaOrderReadModels` infrastructure:
  - customer history reads from `Purchase` plus joined `SellerOrder` / `SellerOrderItem` snapshots
  - seller dashboard reads directly from `SellerOrder` plus its `Purchase` buyer snapshot
  - item display data comes from seller-order item snapshots rather than joining back to mutable products
- Updated legacy `getCustomerOrders` / `getSellerOrders` compatibility functions to delegate to the new ordering read use cases while leaving `/api/orders` and `/api/orders/seller` as temporary API shells.
- Updated order read status typing and display badges so the settings page and seller dropdown can render target statuses such as `OPEN`, `NEW`, `PENDING_PAYMENT`, `PARTIALLY_SHIPPED`, and `PARTIALLY_CANCELED`.
- Kept legacy order detail and status-update paths untouched for the next lifecycle/status slice.

## Files Changed In Previous Slice 2 Read-Model Session

- `src/domains/ordering/dto/order-read-model.ts`
- `src/domains/ordering/application/order-read-models.ts`
- `src/domains/ordering/application/order-read-models.test.ts`
- `src/domains/ordering/infrastructure/prisma-order-read-models.ts`
- `src/data/order.repo.ts`
- `src/actions/order.ts`
- `src/types/enum.ts`
- `src/types/order.ts`
- `src/utils/order-status-label.ts`
- `src/components/order-list.tsx`
- `src/routes/settings/-components/settings-orders-section.tsx`
- `ddd/progress.md`
- `ddd/next-session.md`

## Tests And Checks In Previous Slice 2 Read-Model Session

- `bun run test:unit -- src/domains/ordering/application/order-read-models.test.ts src/actions/order.test.ts` passed: 2 files, 16 tests.
- `bun run typecheck` passed.
- `bunx biome check src/domains/ordering/application/place-purchase.prisma.test.ts src/domains/ordering/dto/order-read-model.ts src/domains/ordering/application/order-read-models.ts src/domains/ordering/application/order-read-models.test.ts src/domains/ordering/infrastructure/prisma-order-read-models.ts src/utils/order-status-label.ts src/types/enum.ts src/types/order.ts src/data/order.repo.ts src/actions/order.ts src/routes/settings/-components/settings-orders-section.tsx src/components/order-list.tsx` passed after `--write` formatting.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma migrate status` passed after sandbox escalation: database schema is up to date.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed after sandbox escalation: 1 file, 6 tests.
- `bun run test:unit` passed: 19 files passed, 1 DB integration file skipped by default; 183 tests passed, 6 skipped.
- `bun run docs:check` passed.

## Decisions In Previous Slice 2 Read-Model Session

- Keep the existing `/api/orders` and `/api/orders/seller` routes as compatibility delivery shells for this increment, but move the actual list read behavior to ordering-context use cases and Prisma adapters.
- Buyer list rows use `Purchase.id` as the compatibility row ID; seller dashboard rows use `SellerOrder.id` so the next status slice can target seller orders directly.
- The legacy `trackingNumber` display field now carries `Purchase.purchaseNumber` for buyer rows and `SellerOrder.trackingNumber ?? Purchase.purchaseNumber` for seller rows.
- Target read rows do not invent a persisted payment method; `OrderResponse.paymentMethod` is optional for reads because payment-method selection currently remains DTO validation only.
- Admin seller-dashboard reads use the approved admin policy to read all seller orders.
- Do not add new server-function read wrappers in this step because `requestLoggerMiddleware` still logs successful non-`Response` server-function returns as status `500`; keep that as an explicit follow-up before broad server-function read migration.

## Risks / Follow-Ups From Previous Slice 2 Read-Model Session

- `ChangeSellerOrderStatus` is not implemented yet; legacy `/api/orders/$id` PUT still updates old global `Order.status`.
- Legacy `/api/orders/$id` detail reads still use old `Order` / `OrderItem`; purchase detail/admin target reads remain for a follow-up.
- `src/actions/order.test.ts` still contains the expected-failing seller order-status ownership characterization test.
- No browser smoke was run for the new read adapter in this session; coverage includes focused use-case tests, typecheck, full unit suite, Biome, and the gated local Postgres integration test.
- Existing follow-ups remain: non-fatal add-to-cart router warning from `src/components/product-actions.tsx`, misleading server-function request logging for non-`Response` returns, and old `/api/orders` POST compatibility cleanup.
- `ddd/` files remain temporary worktree handoff docs and should be removed before opening a PR.

## Previous Slice 1 Checkout Delivery Session Notes

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
- Ran a Codex Desktop in-app browser checkout smoke on 2026-06-12 through `usePlaceOrder` -> `createOrder` -> `placePurchaseFn` -> `PlacePurchase`.
- Browser smoke confirmed:
  - customer login works with a seeded customer
  - an approved listing can be added to cart and checked out
  - checkout shows the existing success toast and returns to `/shop`
  - product stock decrements from `3` to `2`
  - cart header count clears after success
- Post-smoke DB verification confirmed one target `Purchase`, one target `SellerOrder`, one `SellerOrderItem`, and buyer/seller notifications with target DDD IDs.
- Smoke notifications used `purchaseId` / `sellerOrderId` with `orderId = null`.

## Files Changed In Previous Slice 1 Checkout Delivery Session

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

## Tests And Checks In Previous Slice 1 Checkout Delivery Session

- `bun run test:unit -- src/server/place-purchase-service.test.ts src/domains/ordering/application/place-purchase.test.ts src/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator.test.ts` passed: 3 files, 17 tests.
- `bun run typecheck` passed.
- `bun run test:unit` passed: 19 files passed, 1 DB integration file skipped by default; 165 tests passed, 4 skipped.
- `bunx biome check src/domains/ordering/dto/place-purchase-request.ts src/domains/ordering/infrastructure/prisma-place-purchase.ts src/domains/shared/infrastructure/prisma-unit-of-work.ts src/server/place-purchase-service.ts src/server/order.functions.ts src/lib/tanstack-query/orders-queries.ts src/domains/ordering/application/place-purchase.prisma.test.ts src/server/place-purchase-service.test.ts` passed.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff RUN_DB_TESTS=1 bun run test:unit -- src/domains/ordering/application/place-purchase.prisma.test.ts` passed after sandbox escalation was required for localhost database access: 1 file, 4 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run build` passed.
- `bun run docs:check` passed.
- Codex Desktop in-app browser checkout smoke passed against `http://127.0.0.1:43177` after local smoke data seeding and sandbox escalation for localhost server/database access.
- Post-smoke DB verification passed:
  - `Purchase.customerId = customerIdSnapshot = smoke-customer-ddd`
  - `SellerOrder.sellerId = sellerIdSnapshot = smoke-seller-ddd`
  - `SellerOrderItem.listingId = smoke-listing-ddd`
  - buyer notification has `purchaseId` and no `sellerOrderId`
  - seller notification has both `purchaseId` and `sellerOrderId`
  - both target notifications have `orderId = null`

## Decisions In Previous Slice 1 Checkout Delivery Session

- Preserve existing checkout UX and `createOrder` mutation naming as a compatibility wrapper while changing its implementation to the target `PlacePurchase` path.
- Keep the current payment-method selection validated at the delivery DTO edge, but do not let it alter domain payment state; current checkout still creates `Purchase.paymentStatus = MANUALLY_CONFIRMED`.
- Keep Prisma singleton access lazy in the server delivery helper so unit tests can exercise the delivery mapping module without importing environment-bound infrastructure.

## Risks / Follow-Ups From Previous Slice 1 Checkout Delivery Session

- Browser smoke found one non-fatal existing router warning from product add-to-cart flow: `Could not find match for from: /cart`, likely from `navigate({ from: "/cart" })` in `src/components/product-actions.tsx`.
- Browser smoke also exposed misleading server-function request logs: successful server-function returns without a `Response` wrapper are logged as status `500` by `requestLoggerMiddleware` because it defaults non-`Response` results to `new Response(null, { status: 500 })`.
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
