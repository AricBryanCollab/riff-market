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
| `10` Naming and polish | Complete for the non-persistence naming scope. DTO, application, infrastructure-helper, route internals, hooks, utilities, UI components, store files, constants, and visible copy now use listing vocabulary where compatibility allows. Product-to-Listing persistence/schema rename remains future work. |
| `11` Product-to-Listing persistence rename | Complete for listing-owned persistence names. Generated Prisma vocabulary exposes `Listing`/`ListingCategory`/`ListingCondition`, and the new SQL migration renames the physical Product table/enums/productId columns, constraints, and indexes in place. |

## Current Slice 7 State

- Review DTOs, use cases, domain review validation, and Prisma adapter now live under `src/domains/reviews`.
- `Review` domain vocabulary uses `listingId`.
- `prisma/schema.prisma` now exposes `Review.listingId` directly; the Slice 11 physical persistence rename removed the old `productId` column bridge.
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
- Remaining low-risk naming surfaces include product-named listing read server-function compatibility names, product query hook/cache names, and product route/component naming.
- Listing read/query DTOs now live in `src/domains/listings/dto/listing-read-model.ts`:
  - `ListingReadDto` replaces the old global `BaseProduct` read shape for hooks/components.
  - Listing search/filter, shop search, category metadata/count, and approved/pending count DTO names moved to listing vocabulary.
  - `src/server/listing-read-service.ts` now returns listing-owned read DTO types instead of private product API read model aliases.
- Listing command/form/status response compatibility DTOs now live in `src/domains/listings/dto/listing-command.ts`.
- `src/types/product.ts` was removed; product-named hooks import listing-owned DTOs while keeping hook names and returned UI shape unchanged.
- Listing read status aliases the canonical domain `ListingStatus` instead of duplicating a status union in the read DTO module.
- Product cache keys, route paths, hook names, and component filenames were intentionally left unchanged in this DTO move.
- Listing read server-function internals now use listing vocabulary where possible:
  - `src/server/listing-read-service.ts` exposes listing-named primary helpers such as `getListingDetailsReadDto`, `searchApprovedListingReadDtos`, and `listCartListingReadDtos`.
  - `src/server/listing-read.functions.ts` keeps the exported `*ProductApiFn` server-function compatibility names but calls listing-named service helpers and validators internally.
  - Listing read DTO schemas now use listing-oriented names such as `approvedListingSearchInputSchema` and `cartListingDetailsInputSchema`.
  - Private read-hook error unwrap/query-input helpers now use listing read names while hook exports, returned UI names, query key strings, and component/route filenames remain unchanged.
- Component and cart-detail local aliases now use listing vocabulary where possible:
  - Home grid, recent listings, pending approval list, and shop display loops use `listing` callback/local aliases while preserving `ProductCard` / `FeaturedProductCard` `product` prop compatibility.
  - `HeroCarousel` uses a private `listing` alias for the current carousel item while preserving the `products` prop and `/product/$id` route links.
  - `useCartDetails` aliases fetched cart detail rows as `listings` / `listingsById` internally while preserving `productId` cart/query inputs and the returned cart item `product` shape.
- Create/update listing hook internals now use listing draft vocabulary where compatibility allows:
  - `useCreateProduct` uses private `initialListingDraft`, `listingDraft`, `setListingDraft`, `listingPayload`, and `prepareListingFormData` names while preserving the hook export, returned `product` key, cache invalidation, toast copy, and route navigation.
  - `useUpdateProduct` uses private `listingDraft`, `setListingDraft`, `listingData`, and `prepareListingFormData` names while preserving the hook export, returned `product` key, existing loading/error return keys, cache invalidation, toast copy, and route navigation.
- Create/update product compatibility hooks now expose listing-named aliases for new route code while preserving their existing product-compatible return keys:
  - `useCreateProduct` returns `listingDraft`, `isListingCreating`, and `isListingCreateError` alongside existing `product`, `loading`, and `isError` keys.
  - `useListingById` now exposes listing-named detail query keys, while `useProductById` remains as a compatibility wrapper.
  - `useUpdateProduct` now consumes `useListingById` and returns only listing-named state keys: `listingDraft`, `isListingLoading`, `isListingError`, `isListingUpdateLoading`, `errorUpdateListing`, and `refetchListingDetails`.
- Create/edit listing route internals now consume listing-named hook aliases in `src/routes/product/new.tsx` and `src/routes/product/edit.$id.tsx`, while preserving route paths, hook exports, existing hook return keys, form field IDs, UI copy, and product-labeled UI controls.
- Product detail route internals now alias the fetched detail DTO as `listing` and use a private `isPublicListingVisible` helper in `src/routes/product/$id.tsx`, while preserving `/product/$id`, `productbyIdQueryOpt`, product-named component imports/props, delete dialog compatibility, and user-facing product copy.
- Remaining low-risk Slice 10 internals now use listing vocabulary:
  - listing command DTO type names moved from `ProductListing*` / `ListingProduct*` to listing-named DTO types while preserving the serialized `product` response field.
  - listing money helpers moved from `product-money` to `listing-money`, with listing-named function/type exports and behavior-equivalent tests.
  - listing image infrastructure private helpers now use listing vocabulary while preserving the Cloudinary `products` folder compatibility detail.
  - Prisma listing command/moderation adapters now use listing-named private result locals while preserving generated Prisma `Product` model/client/enum vocabulary.
  - mutation hooks now use listing-named private mutation commands and cache invalidation aliases while preserving hook export names, returned compatibility keys, route navigation, and product-facing toast/log copy.
  - utility modules moved to listing vocabulary: `can-modify-listing`, `validate-listing-search`, and `transform-listing-category-count`.
- Thermo-nuclear review follow-up tightened two private internals without changing behavior:
  - `src/hooks/use-update-product-status.ts` now uses a listing-shaped private mutation variable (`listingId` / `shouldApproveListing`) before mapping to the server function's `listingId` / `decision` request.
  - `src/domains/listings/infrastructure/prisma-listing-read-models.ts` no longer casts `ListingReadRow` through the listing money source type; the mapper now relies on the actual row shape.
- Slice 10 UI vocabulary clarification follow-up:
  - `ddd/migration-plan.md` now explicitly says UI and delivery vocabulary should converge on `Listing`; `Product` is legacy compatibility only for persistence/schema, generated Prisma types before the schema slice, old route paths, cache keys, and serialized response shapes during the compatibility window.
  - Delete-listing UI flow now uses listing vocabulary: `src/hooks/use-delete-listing.ts`, `src/components/delete-listing-confirm.tsx`, `deleteListing` dialog state, listing-named loading/handler return fields, and listing-facing delete toast/error copy.
  - Listing moderation UI flow now uses listing vocabulary: `src/hooks/use-moderate-listing.ts`, `ListingDetailsActions`, listing-named moderation handler/loading state, and listing-facing approve/decline toast/error copy.
  - Create/update listing delivery hooks now use listing filenames and exports: `src/hooks/use-create-listing.ts` and `src/hooks/use-update-listing.ts`; create-route dead product-compatible return aliases were removed.
  - Create/edit listing routes now import listing-named hooks and use listing-facing form labels and helper copy while preserving `/product/new` and `/product/edit/$id` route paths.
  - Listing read hooks now use listing filenames and exports: `src/hooks/use-get-listings.ts` owns approved/featured/detail/status-count listing query helpers, and `src/hooks/use-get-listing-count.ts` owns category-count reads while preserving product cache keys and product-shaped count response fields as compatibility details.
  - Shop/product detail touched copy now says listing where it is not preserving route compatibility.
- App-facing UI/delivery component, store, hook, constants, and local type names now use listing vocabulary:
  - recent/pending hooks moved to `use-get-recent-listings.ts` and `use-get-pending-listings.ts`, with listing-named return fields and query option exports while preserving product cache key strings and server-function compatibility aliases.
  - pending moderation state moved from `pending-product.ts` to `pending-listing.ts`, with listing-named store fields/actions.
  - shop and home components moved from product filenames/props to listing filenames/props: `listing-card`, `listing-filter-badges`, `pending-listing-list`, `featured-listing-card`, `listing-grid`, and `featured-listings`.
  - empty/error/loading state exports, listing category/condition options, listing category metadata, local enum types, and visible marketplace copy now use listing vocabulary.
  - cart detail hydration exposes `listing` for fetched listing details while intentionally preserving persisted cart `productId` state.
- Existing `*ProductApiFn`, `invalidateProductCache`, product cache key strings, and serialized `product` response/request fields remain only as compatibility aliases; they should not be used directly for new app-facing code.
- Remaining Product vocabulary is now limited to explicit compatibility boundaries: `/product/*` route paths, query key strings, serialized response/request fields such as `product`, `productId`, and `pendingProductCount`, Cloudinary folder names, media cleanup source names, and order/cart shapes that must survive the compatibility window.
- The larger physical persistence rename is complete for listing-owned tables, enums, columns, constraints, and indexes; `prisma/schema.prisma` no longer uses Product bridge mapping for Listing persistence.
- Final thermo-nuclear review follow-up removed the last non-compatibility naming leaks found in this worktree:
  - app-facing listing files now import `ListingCategory` from the local enum boundary instead of aliasing generated Prisma `ProductCategory` directly.
  - `HeroCarousel` now links to `/product/$id` through the typed route pattern instead of a casted interpolated path with a trailing space.
  - listing money and listing read DTO validation messages now say `Listing price` rather than `Product price`.

## Current Slice 11 State

- The next slice after Slice 10 is the Product-to-Listing persistence/schema bridge.
- `prisma/schema.prisma` now exposes generated Prisma `Listing`, `ListingCategory`, and `ListingCondition` names without Product bridge mapping.
- `prisma/migrations/20260629130000_rename_product_persistence_to_listing/migration.sql` renames the physical `Product` table to `Listing`, `ProductCategory` to `ListingCategory`, and misspelled `ProductCondtion` to `ListingCondition`.
- The same migration renames legacy `productId` columns on `OrderItem`, `Review`, and `Favorite` to `listingId`, plus related foreign key constraints, unique indexes, and lookup indexes.
- Listing-owned physical indexes now use listing names, including the existing `priceCents` index, which is now declared in the Prisma schema as `@@index([priceCents])`.
- Listing command/read/moderation infrastructure, purchase stock reservation, account media cleanup staging, Prisma seed helpers, and DB-facing test assertions now use `db.listing` and `Prisma.Listing*` generated APIs.
- Remaining product vocabulary is compatibility-only: `/product/*` URLs, product cache key strings, serialized `product` / `productId` fields used by cart/order API shapes, Cloudinary folder names, and media cleanup `PRODUCT` source names.

## Latest Verification

- Slice 11 physical persistence rename Prisma schema validation passed with the Codex-bundled Node runtime: `/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/prisma/build/index.js validate --schema prisma/schema.prisma`.
- Slice 11 physical persistence rename Prisma schema formatting passed with the Codex-bundled Node runtime: `/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/prisma/build/index.js format --schema prisma/schema.prisma`.
- Slice 11 physical persistence rename Prisma client generation passed: `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate /Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma`.
- `bun run typecheck` passed after the Slice 11 physical persistence rename.
- Slice 11 focused unit run passed with the Codex-bundled Node runtime and sandbox-safe Vite config loading: `/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vitest/vitest.mjs run --config vitest.config.ts --configLoader runner src/domains/media/infrastructure/prisma-account-media-cleanup-staging.test.ts src/server/listing-service.prisma.test.ts src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts src/domains/ordering/application/place-purchase.prisma.test.ts` -> 1 file passed, 3 DB-backed files skipped; 1 test passed, 27 DB-backed tests skipped.
- Slice 11 schema stale bridge scan passed: `rg -n "@@map|@map\\(|ProductCategory|ProductCondtion|model Product|\\bproductId\\b|Product_sellerId|Product_category|Product_priceCents|Product_isApproved|Product_listingStatus|_productId_|productId_" prisma/schema.prisma` returned no matches.
- Slice 11 stale generated-Prisma source scan passed: `rg -n "db\\.product|context\\.product|this\\.db\\.product|Prisma\\.Product|ProductCategory|ProductCondtion" src --glob '!routeTree.gen.ts'` returned no matches.
- `bun run check -- prisma/schema.prisma prisma/migrations/20260629130000_rename_product_persistence_to_listing/migration.sql ddd/progress.md` processed no files because Biome ignores Prisma schema, SQL migrations, and `ddd` docs in this repo.
- `git diff --check` passed after the Slice 11 physical persistence rename.
- Slice 11 Prisma schema validation passed with the Codex-bundled Node runtime because the local `node` on PATH is too old for Prisma 7 WASM: `/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/prisma/build/index.js validate --schema prisma/schema.prisma`.
- Slice 11 Prisma schema formatting passed with the Codex-bundled Node runtime: `/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/prisma/build/index.js format --schema prisma/schema.prisma`.
- Slice 11 Prisma client generation passed: `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate /Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/prisma/build/index.js generate --schema prisma/schema.prisma`.
- `bun run typecheck` passed after the Slice 11 Prisma schema bridge.
- Slice 11 touched-file Biome passed: `bun run check -- prisma/schema.prisma src/domains/listings/infrastructure/prisma-listing-commands.ts src/domains/listings/infrastructure/prisma-listing-read-models.ts src/domains/listings/infrastructure/prisma-listing-moderation.ts src/domains/ordering/infrastructure/prisma-listings-for-purchase.ts src/domains/media/infrastructure/prisma-account-media-cleanup-staging.ts src/domains/media/infrastructure/prisma-account-media-cleanup-staging.test.ts src/test/prisma-test-data.ts src/server/listing-service.prisma.test.ts`.
- Slice 11 focused unit run passed with the Codex-bundled Node runtime and sandbox-safe Vite config loading: `/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node node_modules/vitest/vitest.mjs run --config vitest.config.ts --configLoader runner src/domains/media/infrastructure/prisma-account-media-cleanup-staging.test.ts src/server/listing-service.prisma.test.ts src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts src/domains/ordering/application/place-purchase.prisma.test.ts` -> 1 file passed, 3 DB-backed files skipped; 1 test passed, 27 DB-backed tests skipped. The plain `bun run test:unit -- ...` attempt failed because the local `node` on PATH is too old for current Vite.
- Slice 11 stale generated-Prisma scan passed: `rg -n "db\\.product|context\\.product|this\\.db\\.product|Prisma\\.Product|ProductCategory|ProductCondtion" src --glob '!routeTree.gen.ts'` returned no matches.
- Slice 11 schema stale generated-name scan passed: `rg -n "^(model Product|enum ProductCategory|enum ProductCondtion)\\b|\\bproduct\\s+Product\\b|\\bProduct\\[\\]" prisma/schema.prisma` returned no matches.
- `git diff --check` passed after the Slice 11 Prisma schema bridge.
- Final thermo-nuclear review focused Biome passed: `bun run check -- src/components/listing-filter-badges.tsx src/components/home/hero-carousel.tsx 'src/routes/product/edit.$id.tsx' src/domains/listings/application/listing-money.ts src/domains/listings/application/listing-money.test.ts src/domains/listings/dto/listing-read-model.ts`.
- Final thermo-nuclear review focused money unit test passed with sandbox-safe Vite config loading: `bunx vitest run --config vitest.config.ts --configLoader runner src/domains/listings/application/listing-money.test.ts` -> 1 file passed, 9 tests passed. The plain `bun run test:unit -- src/domains/listings/application/listing-money.test.ts` attempt hit the known Vite temp-file write issue under the shared `node_modules` symlink, and unsandboxed rerun was policy-rejected.
- `bun run typecheck` passed after the final thermo-nuclear review fixes.
- Final compatibility guard scans passed: `find src -iname '*product*' -print` returned only `src/routes/product`; `find src/routes -path '*/api*' -print` returned no files; targeted scan for direct generated Prisma enum aliases, Product-price messages, and casted `/product/$id` hero links returned no matches; broad app-surface Product scan returned only expected compatibility route, query-key, cart/order shape, and `/product/*` link hits.
- `git diff --check` passed after the final thermo-nuclear review fixes and progress update.
- Slice 10 app-facing vocabulary pass Biome passed after formatting: `bun run check -- src/domains/listings/dto/listing-command.ts src/domains/listings/dto/listing-read-model.ts src/hooks/use-get-recent-listings.ts src/hooks/use-get-pending-listings.ts src/store/pending-listing.ts src/components/listing-card.tsx src/components/listing-filter-badges.tsx src/components/pending-listing-list.tsx src/components/home/featured-listing-card.tsx src/components/home/listing-grid.tsx src/components/home/featured-listings.tsx src/components/home/mocks.ts src/components/home/hero-carousel.tsx src/components/home/recent-listings.tsx src/components/empty-states.tsx src/components/error-states.tsx src/components/loading-states.tsx src/constants/select-options.ts src/constants/listing-category-metadata.ts src/types/enum.ts src/utils/transform-listing-category-count.ts src/components/home/condition-badge.tsx src/components/sidebar/category-filters.tsx src/components/sidebar/condition-filters.tsx src/routes/product/new.tsx 'src/routes/product/edit.$id.tsx' 'src/routes/product/$id.tsx' src/routes/index.tsx src/routes/shop/index.tsx src/components/user-menu.tsx src/types/cart.ts src/hooks/use-cart-details.ts src/components/cart-card.tsx src/components/cart-list.tsx src/components/order/order-item-card.tsx src/constants/role-description.ts src/routes/reviews/index.tsx src/routes/community.tsx 'src/routes/settings/-components/settings-orders-section.tsx' src/components/order-list.tsx`.
- `bun run typecheck` passed after the app-facing vocabulary pass.
- Slice 10 focused unit tests passed after sandbox escalation for the known Vite cache write through the shared `node_modules` symlink: `bun run test:unit -- src/domains/listings/application/listing-money.test.ts src/utils/can-modify-listing.test.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/infrastructure/listing-image-assets.test.ts` -> 4 files passed, 44 tests passed.
- Slice 10 app-facing filename scan passed: `find src -iname '*product*' -print` returned only `src/routes/product`.
- Slice 10 stale app-facing symbol scan confirmed remaining Product vocabulary is compatibility/persistence only: `rg -n "Product|product|Products|products" src/components src/hooks src/store src/routes src/constants src/types --glob '!routeTree.gen.ts'`.
- Slice 10 UI vocabulary follow-up Biome passed after import-order formatting: `bun run check -- src/components/delete-listing-confirm.tsx src/components/listing-actions.tsx src/components/page-headers.tsx src/hooks/use-delete-listing.ts src/hooks/use-moderate-listing.ts src/hooks/use-create-product.ts src/hooks/use-update-product.ts 'src/routes/product/$id.tsx' src/routes/shop/index.tsx src/server/listing-service.ts src/types/enum.ts ddd/migration-plan.md`.
- `bun run typecheck` passed after the Slice 10 UI vocabulary follow-up.
- Slice 10 delete/moderation stale-name scan passed: `rg -n "useDeleteProduct|DeleteProductConfirm|delete-product-confirm|use-delete-product|handleDeleteProduct|loadingDeleteProduct|errorDeleteProduct|useUpdateProductStatus|handleUpdateProductStatus|ProductDetailsActions|ShopPageProductActions|product-actions|deleteProduct|Product ID not found|modify this product|Product is already approved|delete this product|Failed to add a product|Failed to update the product|successfully added your product|product has been updated|Failed to update product status|Product approved successfully|Product declined successfully" src` returned no matches.
- Slice 10 create/update hook filename follow-up Biome passed: `bun run check -- src/hooks/use-create-listing.ts src/hooks/use-update-listing.ts src/routes/product/new.tsx 'src/routes/product/edit.$id.tsx' ddd/progress.md`.
- `bun run typecheck` passed after the create/update hook filename follow-up.
- Slice 10 create/update stale-name scan passed: `rg -n "useUpdateProduct|use-update-product|useCreateProduct|use-create-product|clearCreateProductForm|loading:\\s*isPending|product:\\s*listingDraft|Add Product|Update My Product|Product Name|Product Brand|Product Description|Product Classification|Product Condition|Product Price Per Unit|Product Photos|successfully added your product|product has been updated|Failed to add a product|Failed to update the product" src/routes/product src/hooks/use-create-listing.ts src/hooks/use-update-listing.ts src/server/listing-service.ts` returned no matches.
- Slice 10 read-hook filename follow-up Biome passed after import/format fixes: `bun run check -- src/hooks/use-get-listings.ts src/hooks/use-get-listing-count.ts src/hooks/use-shop-pagination.ts src/hooks/use-update-listing.ts src/components/home/category-grid.tsx src/components/user-menu.tsx src/routes/index.tsx 'src/routes/product/$id.tsx' src/routes/shop/index.tsx`.
- `bun run typecheck` passed after the read-hook filename follow-up.
- Slice 10 read-hook stale-name scan passed for the renamed surface: `rg -n "use-get-products|use-get-product-count|approvedProductsQueryOpt|featuredProductsQueryOpt|productbyIdQueryOpt|productCountByStatusQueryOpt|productCountByCategoryOptions|useApprovedProducts|useApprovedProductCount|useGetProductCount|useProductById|useFeaturedProducts|featuredProducts|loadingFeatured\\b|isErrorFeatured\\b|products,|refetchProducts|hasProducts|isLoadingProducts|isErrorProducts|productCount|isErrorProductCount|loadingProductCount" src/hooks src/routes src/components` returned only unrelated follow-up hits in cart/home mock and prop vocabulary.
- Thermo-nuclear review follow-up Biome passed: `bun run check -- src/domains/listings/dto/listing-command.ts src/domains/listings/infrastructure/prisma-listing-read-models.ts src/hooks/use-update-product-status.ts`.
- `bun run typecheck` passed after the thermo-nuclear review follow-up.
- Slice 10 focused unit tests passed after sandbox escalation for Vite cache writes through the shared `node_modules` symlink: `bun run test:unit -- src/domains/listings/application/listing-money.test.ts src/utils/can-modify-listing.test.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/infrastructure/listing-image-assets.test.ts` -> 4 files passed, 44 tests passed.
- Thermo-nuclear review stale renamed-symbol scan passed: `rg -n "canModifyProduct|isActionDisabled|validateProductSearch|transformProductCategoryCount|can-modify-product|validate-product-search|transform-product-category-count|product-money|ProductListingMutationResponse|ProductListingRemovalResponse|ProductListingModerationRequest|ProductListingModerationResult|ListingProductFormDraftFields|UpdateListingProductFormDraft|ProductImage|uploadProduct|cleanupProduct|toProductCleanup|MAX_PRODUCT" src` returned no matches.
- Route guard scan passed after thermo-nuclear review: `find src/routes -path '*/api*' -print` returned no files.
- `src/data` product scan passed after thermo-nuclear review: `rg -n "product|Product" src/data` returned no matches.
- `git diff --check` passed after the thermo-nuclear review follow-up.
- Slice 10 completion touched-file Biome passed after formatting: `bun run check -- src/components/product-actions.tsx src/domains/listings/application/manage-listing.ts src/domains/listings/application/listing-money.ts src/domains/listings/application/listing-money.test.ts src/domains/listings/dto/listing-command.ts src/domains/listings/dto/listing-form.ts src/domains/listings/dto/listing-read-model.ts src/domains/listings/infrastructure/listing-image-assets.ts src/domains/listings/infrastructure/prisma-listing-commands.ts src/domains/listings/infrastructure/prisma-listing-moderation.ts src/domains/listings/infrastructure/prisma-listing-read-models.ts src/hooks/use-create-product.ts src/hooks/use-delete-product.ts src/hooks/use-get-product-count.ts src/hooks/use-update-product-status.ts src/hooks/use-update-product.ts 'src/routes/product/$id.tsx' src/routes/shop/index.tsx src/server/listing-service.ts src/utils/can-modify-listing.ts src/utils/can-modify-listing.test.ts src/utils/transform-listing-category-count.ts src/utils/validate-listing-search.ts`.
- Slice 10 focused unit tests passed after sandbox escalation for Vite cache writes through the shared `node_modules` symlink: `bun run test:unit -- src/domains/listings/application/listing-money.test.ts src/utils/can-modify-listing.test.ts src/domains/listings/application/manage-listing.test.ts src/domains/listings/infrastructure/listing-image-assets.test.ts` -> 4 files passed, 44 tests passed. The first sandboxed attempt failed on the known Vite cache write issue; the first escalated attempt caught one stale test expectation (`prod-1`) that was corrected.
- `bun run typecheck` passed after the Slice 10 completion cleanup.
- Slice 10 stale renamed-symbol scan passed: `rg -n "canModifyProduct|isActionDisabled|validateProductSearch|transformProductCategoryCount|can-modify-product|validate-product-search|transform-product-category-count|product-money|ProductListingMutationResponse|ProductListingRemovalResponse|ProductListingModerationRequest|ProductListingModerationResult|ListingProductFormDraftFields|UpdateListingProductFormDraft|ProductImage|uploadProduct|cleanupProduct|toProductCleanup|MAX_PRODUCT" src` returned no matches.
- `src/data` product scan passed: `rg -n "product|Product" src/data` returned no matches. `src/actions` no longer exists.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the Slice 10 completion cleanup.
- Slice 10 product detail route local alias cleanup touched-file Biome passed after adding the ignored delegated-worktree `node_modules` symlink to `/Users/aricjiang/dev/apps/riff-market-ddd-map/node_modules`: `bun run check -- 'src/routes/product/$id.tsx'`. The first attempt failed with `biome: command not found` before the symlink existed.
- Slice 10 product detail route stale private-name scan passed: `rg -n "data:\\s*product|\\bproduct\\.(images|name|brand|model|category|stock|price|sellerId|isApproved|description|seller)|isPublicProductVisible|!product\\b" 'src/routes/product/$id.tsx'` returned no matches.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the product detail route local alias cleanup.
- `bun run typecheck` passed after regenerating the local Prisma client with `bun run db:generate`. The first local typecheck setup check found `generated/prisma` absent in this delegated worktree.
- Slice 10 create/edit route and hook alias cleanup touched-file Biome passed: `bun run check -- src/hooks/use-get-products.ts src/hooks/use-update-product.ts src/hooks/use-create-product.ts src/routes/product/new.tsx 'src/routes/product/edit.$id.tsx'`.
- Slice 10 update hook stale product detail key scan passed: `rg -n "useProductById|loadingProduct|isErrorProduct|refetchProductDetails|product:\\s*listingData" src/hooks/use-update-product.ts` returned no matches.
- Slice 10 listing detail compatibility scan confirmed product-named detail keys now remain only in `useProductById` compatibility wrapper and unrelated product count/list hooks: `rg -n "export const useProductById|loadingProduct|isErrorProduct|refetchProductDetails|product:\\s*listing" src/hooks/use-get-products.ts`.
- Slice 10 create/edit route alias stale private-state scan passed: `rg --pcre2 -n "value=\\{product|product\\?\\.|\\bproduct\\.(name|brand|model|description|category|condition|stock|price)|\\bloadingProduct\\b(?!:)|\\bloadingUpdateProduct\\b(?!:)|\\bisErrorProduct\\b(?!:)|\\brefetchProductDetails\\b(?!:)" src/routes/product/new.tsx 'src/routes/product/edit.$id.tsx'` returned no matches.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the edit-listing route alias cleanup.
- `bun run typecheck` passed after the edit-listing route alias cleanup.
- Slice 10 create-listing route alias cleanup touched-file Biome passed after adding the ignored delegated-worktree `node_modules` symlink to `/Users/aricjiang/dev/apps/riff-market-ddd-map/node_modules`: `bun run check -- src/routes/product/new.tsx`. The first attempt failed with `biome: command not found` before the symlink existed.
- Slice 10 create-listing route alias stale private-state scan passed: `rg -n "value=\\{product|product\\?\\.|\\bproduct\\.(name|brand|model|description|category|condition|stock|price)" src/routes/product/new.tsx` returned no matches.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the create-listing route alias cleanup.
- `bun run typecheck` passed after regenerating the local Prisma client with `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate bun run db:generate`. The first attempt failed because `generated/prisma` was absent in this delegated worktree.
- Slice 10 create/update hook private draft cleanup touched-file Biome passed after adding the ignored delegated-worktree `node_modules` symlink to `/Users/aricjiang/dev/apps/riff-market-ddd-map/node_modules`: `bun run check -- src/hooks/use-create-product.ts src/hooks/use-update-product.ts`. The first attempt failed with `biome: command not found` before the symlink existed.
- `bun run typecheck` passed after regenerating the local Prisma client with `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate bun run db:generate`. The first attempt failed because `generated/prisma` was absent in this delegated worktree.
- Slice 10 create/update hook stale private-name scan passed: `rg -n "initialProduct|prepareProductFormData|const \[product, setProduct\]|productData|productPayload|setProduct\(" src/hooks/use-create-product.ts src/hooks/use-update-product.ts` returned no matches.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the create/update hook private draft cleanup.
- The verified create/update hook cleanup patch was applied cleanly to the canonical `/Users/aricjiang/dev/apps/riff-market-ddd-map` branch worktree on `codex/ddd-map`; focused Biome, stale-name scan, route guard scan, `git diff --check`, and `bun run typecheck` passed there as well.
- Slice 10 component/cart local alias cleanup touched-file Biome passed after adding the ignored delegated-worktree `node_modules` symlink to `/Users/aricjiang/dev/apps/riff-market-ddd-map/node_modules`: `bun run check -- src/components/home/product-grid.tsx src/components/home/recent-listings.tsx src/components/pending-product-list.tsx src/routes/shop/index.tsx src/components/home/hero-carousel.tsx src/hooks/use-cart-details.ts`. The first attempt failed with `biome: command not found` before the symlink existed.
- `bun run typecheck` passed after regenerating the local Prisma client with `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate bun run db:generate`. The first attempt failed because `generated/prisma` was absent in this delegated worktree.
- Slice 10 component/cart stale local-name scan passed: `rg -n "products\.map\(\(product\)|recentProducts\.map\(\(product\)|pendingProducts\.slice\(0, 5\)\.map\(\(product\)|displayProducts|const product = products\[currentIndex\]|productsById|data: products = \[\]|Product Image|Product Details" src/components/home/product-grid.tsx src/components/home/recent-listings.tsx src/components/pending-product-list.tsx src/routes/shop/index.tsx src/components/home/hero-carousel.tsx src/hooks/use-cart-details.ts` returned no matches.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the component/cart local alias cleanup and progress update.
- Branch sync before this cleanup: fetched `origin/codex/ddd-map`, confirmed `origin/codex/ddd-map`, local `codex/ddd-map`, and this delegated worktree are all at `ae65768`; the checked-out local branch worktree `/Users/aricjiang/dev/apps/riff-market-ddd-map` was fast-forwarded after preserving its pre-existing dirty diff as `stash@{0}` (`before updating codex/ddd-map to origin ae65768`).
- Slice 10 read compatibility internal-name scan passed: `rg -n "ProductReadError|unwrapProductReadResult|isProductReadError|toProductApiQueryInput|ProductApiQueryInput|approvedListingProductApiQuerySchema|listingCartDetailsProductApiQuerySchema|ProductApiReadError|toProductApiListingReadModel|isPublicProductApiListingVisible|productApiQueryInputSchema|productDetailInputSchema|productCountStatusInputSchema" src/hooks src/server src/domains/listings/dto/listing-read-model.ts` returned no matches.
- Slice 10 read compatibility touched-file Biome passed after formatting: `bun run check -- src/domains/listings/dto/listing-read-model.ts src/server/listing-read-service.ts src/server/listing-read.functions.ts src/hooks/use-get-products.ts src/hooks/use-get-recent-products.ts src/hooks/use-get-product-count.ts src/hooks/use-get-pending-products.ts src/hooks/use-cart-details.ts`.
- Slice 10 read compatibility focused read-service tests passed after sandbox escalation for Vite cache writes through the shared `node_modules` symlink: `bun run test:unit -- src/server/listing-read-service.test.ts` -> 1 file passed, 2 tests passed.
- `bun run typecheck` passed after regenerating the local Prisma client with `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate bun run db:generate`.
- Route guard scan passed: `find src/routes -path '*/api*' -print` returned no files.
- `git diff --check` passed after the read compatibility cleanup and progress update.
- Slice 10 command/status compatibility DTO cleanup removed the remaining `@/types/product` imports: `rg -n "@/types/product" src` returned no matches.
- Slice 10 command/status compatibility DTO stale-name scan passed: `rg -n "\bCreateProductRequest\b|\bUpdateProductForm\b|\bUpdateProductRequest\b|\bMutateProductResponse\b|\bProductResponse\b|\bDeleteProductResponse\b|\bUpdateProductStatusRequest\b|\bUpdateProductStatusResult\b" src` returned no matches.
- Slice 10 command/status compatibility DTO touched-file Biome passed: `bun run check -- src/domains/listings/dto/listing-command.ts src/domains/listings/dto/listing-read-model.ts src/server/listing-service.ts src/hooks/use-create-product.ts src/hooks/use-update-product.ts src/hooks/use-delete-product.ts src/hooks/use-update-product-status.ts`.
- Slice 10 command/status compatibility DTO focused read-service tests passed after sandbox escalation for Vite cache writes through the shared `node_modules` symlink: `bun run test:unit -- src/server/listing-read-service.test.ts` -> 1 file passed, 2 tests passed.
- `bun run typecheck` passed after the command/status compatibility DTO cleanup. The worktree required the ignored `node_modules` symlink to `/Users/aricjiang/dev/apps/riff-market-ddd-map/node_modules` and `DATABASE_URL=postgresql://user:pass@localhost:5432/riff_market_generate bun run db:generate` to regenerate the local Prisma client.
- Slice 10 listing read DTO move targeted stale-name scan passed: `rg -n "\bBaseProduct\b|\bGetApprovedProductsFilterQuery\b|\bApprovedProductCount\b|\bPendingProductCount\b|\bProductCountStatusQuery\b|\bProductCountByCategoryData\b|\bCategoryMeta\b|\bShopSearch\b|\bProductListingStatus\b" src` returned no matches.
- Before the command/status cleanup, the Slice 10 listing read DTO move import scan confirmed the only remaining `@/types/product` imports were command/status compatibility hooks: `use-create-product`, `use-update-product`, `use-delete-product`, and `use-update-product-status`.
- Slice 10 listing read DTO move CodeGraph inventory showed `ListingReadDto` owned by `src/domains/listings/dto/listing-read-model.ts` and no `BaseProduct` definition remaining in `src/types/product.ts`.
- Slice 10 listing read DTO move touched-file Biome passed: `bun run check -- src/components/home/category-card.tsx src/components/home/featured-product-card.tsx src/components/home/hero-carousel.tsx src/components/home/mocks.ts src/components/home/product-grid.tsx src/components/pending-product-list.tsx src/components/product-card.tsx src/constants/product-category-metdata.ts src/domains/listings/dto/listing-read-model.ts src/hooks/use-cart-details.ts src/hooks/use-get-pending-products.ts src/hooks/use-get-product-count.ts src/hooks/use-get-products.ts src/hooks/use-get-recent-products.ts src/hooks/use-shop-pagination.ts src/hooks/use-shop-search-filters.ts src/lib/tanstack-query/query-keys.ts src/routes/product/$id.tsx src/server/listing-read-service.ts src/store/pending-product.ts src/types/cart.ts src/types/product.ts src/utils/shop-search.ts src/utils/transform-product-category-count.ts src/utils/validate-product-search.ts`.
- Slice 10 listing read DTO move focused read-service tests passed: `bun run test:unit -- src/server/listing-read-service.test.ts` -> 1 file passed, 2 tests passed.
- `bun run typecheck` passed after the listing read DTO move.
- `git diff --check` passed after the listing read DTO move and progress update. `bun run check -- ddd/progress.md` was attempted, but Biome ignored `ddd/progress.md` and processed no files.
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
- Keep `productId` out of review domain/application/service/server-function vocabulary; review persistence now uses physical `listingId` after the Slice 11 persistence rename.
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

Continue only compatibility-boundary cleanup that is explicitly scoped.

Recommended next step:

1. Run the gated DB suite against a disposable `TEST_DATABASE_URL` to exercise the physical Listing migration and DB-backed listing/order/review flows.
2. If product-shaped serialized fields are intentionally retired later, handle them as a separate compatibility-breaking API/cart/order-shape slice.
3. Before PR handoff, either run an auth browser smoke for sign-in/sign-up/sign-out or explicitly keep the current no-browser-smoke risk noted.
