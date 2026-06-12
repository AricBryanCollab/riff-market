# RiffMarket DDD Migration Plan

Created: 2026-06-10

## Goal

Convert the repo to a pragmatic DDD modular monolith. The architecture should make the marketplace business model explicit while avoiding a broad rewrite.

Core domain: seller listing to customer purchase lifecycle.

Preferred delivery adapter: TanStack server functions. Keep API routes when they are not part of the active migration slice or when HTTP-specific behavior is truly needed.

## Target Architecture

```text
src/domains/<context>/
  domain/
  application/
  infrastructure/
  dto/
```

Layer rules:

- `domain`: classes/value objects/domain events/business invariants.
- `application`: use cases, command/query orchestration, ports, transaction boundaries.
- `infrastructure`: Prisma repositories, storage adapters, provider implementations.
- `dto`: request/response DTOs, Zod schemas for external input, mappers.
- `server functions`: delivery adapters that authenticate, parse input, build `Actor`, and call use cases.
- `routes/components/hooks`: UI and delivery wiring only, not business rules.

Accepted bounded contexts:

- `listings`
- `ordering`
- `accounts`
- `reviews`
- `notifications`
- `media`

Future bounded context:

- `payments` / payment integration, when real Stripe/PayPal/payment-provider behavior is added.

Accepted aggregate roots:

- `Listing`
- `Purchase`
- `SellerOrder`
- `UserAccount`
- `Review`
- `MediaCleanupJob`

Current note: `Notification` is treated as a local inbox/read model and use-case boundary for now, not necessarily a rich aggregate root. Promote it to an aggregate only if notification behavior gains meaningful invariants beyond read/unread and message creation.

Approved domain decisions:

- Multi-seller checkout is required.
- Replace the planned parent `Order` + child `SellerOrder` model with `Purchase` + independent `SellerOrder` aggregate roots.
- `Purchase` owns buyer-facing checkout invariants: customer, purchase total, payment state, and shipping/contact snapshot.
- `SellerOrder` owns seller-facing invariants: sellerId, item snapshots, seller subtotal, seller status, tracking number, and seller permissions.
- `PlacePurchase` can create a `Purchase` and its `SellerOrder` aggregates in one application transaction, but that does not make them one aggregate.
- Buyer order history is a read model joining `Purchase` and `SellerOrder`.
- Seller dashboard queries `SellerOrder` directly.
- `Purchase` does not store `sellerOrderIds`; read models derive seller orders from `SellerOrder.purchaseId`.
- `Purchase.paymentState` is authoritative for buyer payment/checkout state.
- `SellerOrder.status` is authoritative for seller fulfillment state.
- Buyer-facing order status is a derived read-model summary from `Purchase` + `SellerOrder`, not command authority on `Purchase`.
- Replace old global `OrderStatus` with distinct domain statuses:
  - `PurchaseStatus`: `OPEN`, `CANCELED`, `COMPLETED`
  - `PaymentStatus`: `MANUALLY_CONFIRMED`, `PENDING_PAYMENT`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`
  - `SellerOrderStatus`: `ON_HOLD_PAYMENT`, `NEW`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELED`
- Split purchase reference from shipment tracking:
  - `Purchase.purchaseNumber` is the buyer-facing reference number
  - `SellerOrder.trackingNumber` is nullable until that seller ships
- Current checkout uses an explicit demo/manual-payment policy:
  - `Purchase.paymentStatus = MANUALLY_CONFIRMED`
  - `SellerOrder.status = NEW`
  - This preserves current UX without claiming a real payment provider captured funds.
- Future real payment flow can create seller orders as `ON_HOLD_PAYMENT` and release them to `NEW` after payment policy allows fulfillment.
- Local notification rows are created in the same database transaction as purchase placement for now.
- Declined listings become `DECLINED`, not deleted.
- Listings with transactional history are `WITHDRAWN` rather than hard-deleted.
- Fix touched authorization gaps during the migration instead of preserving known bugs.
- Target money storage is integer minor units/cents plus a domain `Money` value object.
- Future real payment integration should introduce `Payment` / `PaymentAttempt`; `Purchase` stores only normalized provider-neutral payment state.
- Persistence vocabulary should converge on `Listing`; `Product` model/table/foreign keys should be renamed in a planned schema slice.

## Migration Principles

- Move behavior behind DDD modules slice by slice.
- Do not convert unrelated API routes just to be tidy.
- Prefer server functions for migrated workflows.
- Migrate upload workflows to server functions where feasible.
- Keep old APIs temporarily when they still serve unmigrated UI.
- Use compatibility wrappers only as temporary migration bridges.
- Domain code must not import React, TanStack, Prisma, Zod, Request, Response, FormData, or Cloudinary.
- Repositories load/save data only. Application use cases coordinate workflows.
- UI helpers may hide/show controls, but they are never the source of permission truth.
- Cart remains client-side draft state for this migration.
- Use cases receive an explicit `Actor`; delivery adapters authenticate and build that actor.
- Server functions remain delivery adapters only. They authenticate, parse DTOs, build `Actor`, call use cases, and map typed errors.
- Money is represented as `Money(amountCents, currencyCode)` in the domain and integer cent columns in persistence.
- Floating-point money fields are migration bridges only, not the final model.

## Slice -1: Characterization And Risk Tests

Purpose: capture migration-relevant visible behavior and expose known bugs before changing architecture. Do not preserve obsolete fake-order schema internals.

Work:

- Add characterization tests around checkout visible behavior.
- Add tests that demonstrate current order read authorization gaps as security issues.
- Add tests around seller status update ownership behavior as security issues.
- Add tests around listing moderation and notification creation.
- Remove or avoid tests that assert the old fake `Order` / `OrderItem` schema shape or persistence internals.
- Rewrite surviving checkout/security/notification tests against `Purchase` / `SellerOrder` as soon as the new model exists.
- Decide which failing characterization tests represent bugs to fix rather than behavior to preserve.

Acceptance criteria:

- Known order authorization gaps are documented by tests before they are fixed.
- Checkout visible behavior is captured enough to compare the DDD implementation.
- The team explicitly approves behavior changes for authorization and declined listings.
- Old fake `Order` persistence/schema behavior is not treated as a compatibility requirement.
- No test locks the new architecture to old fake `Order` / `OrderItem` persistence shape.

Tests:

- Focused Vitest tests around existing actions/routes where possible.

## Slice 0: Foundation

Purpose: create the minimum shared architecture needed for later slices.

Work:

- Add `src/domains/shared/domain/actor.ts`.
- Add `src/domains/shared/domain/domain-event.ts`.
- Add minimal result/error conventions if useful.
- Add shared typed error/result convention for server-function adapters and use cases.
- Add mandatory `src/domains/shared/application/unit-of-work.ts` or transaction runner abstraction.
- The unit of work must allow `PlacePurchase` to create purchase, seller orders, guarded stock updates, and notification rows in one transaction.
- Add `src/domains/shared/domain/money.ts` with integer cents and currency code.
- Add folder structure for accepted contexts.
- Add enforceable import protection for server-only infrastructure where appropriate.

Acceptance criteria:

- New folders compile.
- No behavior changes.
- No client import of server-only infrastructure.
- `PlacePurchase` has a concrete transaction boundary abstraction before Slice 1 starts.
- `Money` rejects invalid values and supports same-currency math.

Tests:

- `bun run typecheck`
- Unit tests for `Money`.

## Slice 0.5: Money Persistence Migration

Purpose: stop building the new listing/domain model on inexact money storage without wasting effort on old fake order tables that will be replaced.

Work:

- Add cent columns alongside existing listing/product Float fields:
  - `Listing.priceCents` after the product/listing schema rename, or `Product.priceCents` as a transitional column if the money slice happens first
- Add `currencyCode` where needed for listing prices. Use `USD` initially unless multi-currency is explicitly added.
- Backfill cent columns from Float fields with audited rounding.
- Add explicit dual-write/read-fallback policy:
  - before cutover, live writers must write both Float and cents or be replaced
  - reads prefer cents when present and fall back to Float only during migration
  - non-null cent constraints wait until all live write paths are migrated
- Add non-null/non-negative constraints only after dual-write/read cutover is complete.
- Update validation to parse price as a decimal string with max two USD fractional digits.
- Convert price filters to cents at DTO/application boundaries.
- Switch new DDD code to cents only.
- Keep old Float fields only as temporary compatibility until all consumers are migrated.
- Drop old Float fields only after verified cents cutover:
  - cent fields added
  - cent fields backfilled
  - compatibility dual-write complete where needed
  - reads switched to cents
  - no live code reads/writes old Float fields
- Do not migrate old fake `Order` / `OrderItem` Float money fields unless temporary compatibility absolutely requires it.
- Create new `Purchase` / `SellerOrder` / seller-order item schema with cent fields from the start in Slice 1.

Acceptance criteria:

- New domain/application code never does money math on Float fields.
- Existing UI can still display prices during transition.
- Live writes cannot create rows missing cent values once the cutover starts.
- Backfill behavior is deterministic and tested.

Tests:

- Money parsing/formatting tests.
- Mapper tests for Float-to-cents backfill assumptions.
- Query/filter tests for cent-based price ranges.

## Slice 1: Place Purchase

Purpose: prove the DDD shape with a real transaction, cross-context coordination, and server-function delivery.

Work:

- Add `Listing` domain model with only purchase-placement behavior:
  - approved/listable check
  - stock availability
  - stock reduction
- Add value objects as needed:
  - `ListingId`
  - `SellerId`
  - `StockQuantity`
  - `Money`
- Add `Purchase` domain model:
  - customer ID
  - purchase number
  - purchase total
  - payment status
  - purchase status
  - shipping/contact snapshot:
    - buyerName
    - buyerEmail
    - buyerPhone
    - shippingAddress
  - require at least one seller order
  - record `PurchasePlaced`
- Add `SellerOrder` aggregate root:
  - seller ID
  - item snapshots
  - seller subtotal
  - seller-specific status
  - seller-specific tracking number
  - seller permissions
- Seller-order item snapshots include:
  - listingId
  - listingName
  - brand
  - model
  - category
  - condition
  - primaryImageUrl
  - sellerId
  - sellerDisplayName
  - unitPriceCents
  - quantity
  - subTotalCents
  - currencyCode
- Add `PlacePurchase` use case in `ordering/application`.
- Add ports:
  - `ListingsForPurchasePort.reserveForPurchase(...)`
  - purchase persistence
  - seller-order persistence
  - same-transaction notification creator/handler for `PurchasePlaced` / seller-order creation events
  - purchase number generation
- Notifications created from purchase/seller-order events should carry both `purchaseId` and `sellerOrderId` where relevant.
- Add Prisma implementations for required ports.
- Move order creation orchestration out of `src/data/order.repo.ts` for this path.
- Add dedicated persistence migration for `Purchase` / `SellerOrder` / seller-order item snapshots, or bridge existing `Order` / `OrderItem` names to these domain concepts during the transition.
- Existing orders are fake/dev data; no production historical order backfill is required.
- Prefer clean target schema and regenerate representative fake `Purchase` / `SellerOrder` data after migration instead of building degraded historical order snapshots.
- Persistence target should include:
  - `Purchase` table/model
  - `SellerOrder` table/model
  - seller-order item snapshot table/model
  - `Purchase.totalAmountCents`
  - `SellerOrder.subtotalCents`
  - seller-order item `unitPriceCents`
  - seller-order item `subTotalCents`
  - currency code snapshots
  - `SellerOrder.purchaseId`
  - notification links for `purchaseId` and `sellerOrderId`
  - seller tracking number nullable until ship
  - purchase number distinct from seller shipment tracking number
- Require atomic guarded stock mutation:
  - aggregate duplicate listing IDs before validation
  - load approved listings inside the transaction
  - update stock with a `stock >= requestedQuantity` guard
  - fail the whole purchase if any guarded update fails
- `ListingsForPurchasePort.reserveForPurchase(...)` contract:
  - runs inside active unit-of-work transaction
  - checks requested listings exist
  - checks listings are `APPROVED` and orderable
  - aggregates duplicate listing IDs
  - performs guarded stock decrement
  - returns seller-grouped item snapshots
  - does not expose Prisma records to `ordering`
- Add `placePurchaseFn` server function. Existing UI text may continue to say "Place Order".
- Update `usePlaceOrder` or order mutation wrapper to call `placePurchaseFn`.
- Keep cart details read API unchanged.
- Do not leave order read/status security unchanged if the slice touches those paths; minimum authorization fixes must ship with the new seller-order model.

Acceptance criteria:

- Customer can place an order from checkout.
- A checkout can include listings from multiple sellers.
- Purchase placement creates one `Purchase` and one independent `SellerOrder` aggregate per seller.
- Current checkout creates `Purchase.paymentStatus = MANUALLY_CONFIRMED` and `SellerOrder.status = NEW`.
- Seller-order item snapshots preserve buyer/seller history even if listings change later.
- Non-customer cannot place an order.
- Missing/unapproved/insufficient-stock listings are rejected.
- Purchase creation, seller-order creation, notification row creation, and stock reduction succeed/fail together in one application transaction.
- Oversell attempts fail under concurrent requests.
- Customer and seller notifications are still created.
- Notification rows are created in the same transaction as the purchase for now.
- Buyer-facing notifications link to `Purchase`; seller-facing notifications link to `SellerOrder` and can also carry `purchaseId`.

Tests:

- Domain unit tests for `Listing`, `Purchase`, and `SellerOrder`.
- Use-case tests for `PlacePurchase` with fake ports.
- Mandatory integration test for transaction/guarded stock mutation.
- Real database integration/concurrency test for guarded stock updates. Mocked repositories are not enough to prove oversell protection.
- Existing checkout/order behavior tests should still pass if they are not coupled to the old fake `Order` / `OrderItem` persistence shape.

## Slice 2: Purchase And SellerOrder Lifecycle

Purpose: move seller-order status behavior and purchase/order read models into the `ordering` context.

Work:

- Add `ChangeSellerOrderStatus` use case.
- Replace old global order status transition logic with `SellerOrderStatus` transitions and `PurchaseStatus` rules.
- Add domain methods:
  - `sellerOrder.process()`
  - `sellerOrder.ship(trackingNumber)`
  - `sellerOrder.deliver()`
  - `sellerOrder.cancel(actor)`
- Add actor/ownership rules:
  - customers can only cancel seller orders that belong to their own purchase
  - sellers can only update their own `SellerOrder`
  - admins can update seller-facing statuses according to policy
- Add secure read use cases:
  - customer can read only their own purchases
  - buyer order history reads a joined `Purchase` + `SellerOrder` read model
  - buyer-facing status is derived from payment state and seller-order statuses
  - buyer-facing derived summary statuses:
    - `PENDING_PAYMENT`
    - `OPEN`
    - `PARTIALLY_SHIPPED`
    - `SHIPPED`
    - `DELIVERED`
    - `PARTIALLY_CANCELED`
    - `CANCELED`
  - seller dashboard queries `SellerOrder` directly
  - admin can read according to admin policy
- Add `SellerOrderStatusChanged` event.
- Add server function for status changes if needed by UI.
- Add ordering query use cases/read DTOs for customer/seller order lists if useful.
- Prioritize server-function reads for:
  - buyer purchase history
  - seller order dashboard
  - purchase detail/admin view
- Leave existing API reads until replacing them is low-risk.

Acceptance criteria:

- Existing intended order status behavior is mapped to seller-order status, and known authorization gaps are fixed.
- Invalid transitions are rejected by domain logic.
- Seller status/tracking updates target `SellerOrder`; `Purchase` is not command authority for seller shipment state.
- Old route/service compatibility is either delegated or retired for migrated commands.

Tests:

- Domain tests for all status transitions.
- Use-case tests for actor permissions and ownership.
- Authorization regression tests for order reads and seller status updates.

## Slice 3: Listing Lifecycle

Purpose: turn current `Product` behavior into the `Listing` bounded context.

Work:

- Expand `Listing` aggregate:
  - create listing
  - update listing
  - delete listing
  - approve listing
  - decline listing
  - image refs
  - seller ownership
- Rename domain language to `Listing` while keeping Prisma/API table names as `Product` if needed.
- Rename Prisma persistence vocabulary from `Product` to `Listing` in this migration plan:
  - `Product` model/table -> `Listing`
  - `productId` FKs -> `listingId`
  - product/listing relations on reviews/favorites/seller-order snapshots where applicable
  - generated Prisma client types and infrastructure adapters updated to listing language
- Use temporary compatibility only during the cutover; final architecture should not keep `Product` as persistence vocabulary.
- Introduce explicit listing moderation status:
  - `PENDING`
  - `APPROVED`
  - `DECLINED`
- Use one `ListingStatus` enum for the first migration:
  - `PENDING`: seller submitted listing, awaiting moderation
  - `APPROVED`: visible/searchable/orderable
  - `DECLINED`: admin rejected listing
  - `WITHDRAWN`: seller removed listing from sale or listing with history is no longer active
- Migrate or bridge existing `Product.isApproved` to `ListingStatus`.
- Add explicit query semantics:
  - pending moderation queries return only `PENDING`
  - shop/search queries return only `APPROVED`
  - declined listings do not appear as pending
  - withdrawn listings do not appear in shop/search
- Add dual-write/read-fallback policy for listing status while old `isApproved` consumers exist.
- Move product validation schemas into `listings/dto`.
- Move product service logic from `src/actions/product.ts` into listing application use cases.
- Move image lifecycle coordination into listing application/infrastructure.
- Add server functions for migrated listing commands:
  - `createListingFn`
  - `updateListingFn`
  - `deleteListingFn`
  - `approveListingFn`
  - `declineListingFn`
- Listing image upload flows should move to server-function delivery where feasible, while image storage/compression/cleanup remains behind application/infrastructure ports.
- Leave product/listing read APIs temporarily if command migration is already stable.

Acceptance criteria:

- Sellers/admins can create/update/remove listings with intentional new lifecycle semantics.
- Admin moderation still approves/declines and notifies sellers.
- Decline behavior marks the listing `DECLINED`; it does not delete the row.
- Hard delete is allowed only for safe draft/unreferenced listings.
- Listings with orders, reviews, favorites, or other meaningful references are `WITHDRAWN` rather than hard-deleted.
- Image cleanup behavior is preserved.

Tests:

- Domain tests for listing ownership, moderation, stock, and image-ref invariants.
- Use-case tests for create/update/delete/moderate listing.
- Existing product action tests are migrated or delegated through compatibility wrappers.

## Slice 4: Listing Queries And Read Models

Purpose: cleanly separate listing domain writes from read/query DTOs.

Work:

- Add listing query use cases:
  - `SearchApprovedListings`
  - `GetListingDetails`
  - `GetSellerListings`
  - `GetPendingListings`
  - `GetRecentListings`
  - count queries
- Add read DTOs under `listings/dto`.
- Move current `BaseProduct`/product response types toward listing DTO names.
- Replace API-backed query wrappers with server functions only where helpful.
- Prioritize server-function reads for:
  - listing detail
  - approved listing search
  - pending listing moderation queue
  - seller listings
- Keep remaining product API routes as compatibility until consumers are gone.

Acceptance criteria:

- Shop, home, product detail, seller listing, pending approval, and cart details still work.
- Client-facing DTOs no longer expose Prisma shape directly.

Tests:

- Query mapper tests.
- Focused tests for filters/search/counts.

## Slice 5: Notifications

Purpose: isolate notification inbox behavior and event-driven creation.

Work:

- Add notification read model/use-case boundary. Keep aggregate modeling minimal unless more invariants appear.
- Add use cases:
  - `CreateNotification`
  - `ReadNotification`
  - `ReadAllNotifications`
  - `GetNotifications`
  - `GetUnreadNotificationCount`
- Move notification message construction out of repositories.
- Add application event handlers for:
  - `PurchasePlaced`
  - seller-order creation/status events as needed
  - `ListingApproved`
  - `ListingDeclined`
- Write local notification rows in the same transaction for now.
- Reserve outbox for future reliable external/async delivery.
- Add notification DTO/schema support for `purchaseId` and `sellerOrderId` links where relevant.

Acceptance criteria:

- Notifications behave the same in UI.
- Repositories no longer construct business notification messages.
- Notification creation policy is centralized and not duplicated between ports and event handlers.

Tests:

- Use-case tests for read/unread.
- Event-handler tests for message creation.

## Slice 6: Accounts

Purpose: move auth/profile/account deletion behavior into `accounts`.

Work:

- Add `UserAccount` aggregate/value objects as needed.
- Move sign up/sign in/profile update/delete account use cases into accounts.
- Keep session handling in delivery/server adapter layer.
- Move profile-picture lifecycle to account application/infrastructure or media integration.
- Move profile-picture upload/update delivery to server functions where feasible.
- Clean `src/actions/user.ts` server-function layering smell.
- Keep existing server functions as adapters, but delegate to account use cases.

Acceptance criteria:

- Current auth/profile/settings behavior is preserved.
- Account deletion still enqueues media cleanup jobs.
- Session clear remains adapter/delivery concern.

Tests:

- Account use-case tests.
- Profile-picture lifecycle tests.
- Existing user action tests migrated or wrapped.

## Slice 7: Reviews

Purpose: isolate review behavior and prepare for stronger review eligibility.

Work:

- Add `Review` aggregate.
- Add `CreateReview` and `GetListingReviews` use cases.
- Rename product review language to listing review in domain/dto.
- Add current invariants:
  - authenticated user
  - rating range
  - one review per user/listing
- Later optional rule:
  - only customers who purchased the listing can review.

Acceptance criteria:

- Review creation/query behavior is preserved.
- Domain vocabulary uses listing, not product.

Tests:

- Review domain/use-case tests.

## Slice 8: Media

Purpose: make media cleanup and provider asset references explicit.

Work:

- Add `MediaCleanupJob` domain model for retry/lock/succeed/fail transitions.
- Move cleanup worker rules from service functions into media domain/application.
- Keep Cloudinary deletion in infrastructure.
- Connect account/listing image lifecycle to media ports.
- Consider outbox/job creation only where reliability matters.

Acceptance criteria:

- Existing media cleanup worker behavior is preserved.
- Retry/locking rules are tested at domain/use-case level.

Tests:

- Domain tests for job status transitions.
- Worker/use-case tests with fake provider adapters.

## Slice 9: API Route Cleanup

Purpose: remove old delivery paths after domains and server functions are stable.

Work:

- Find unused `/api/*` routes.
- Remove API routes replaced by server functions.
- Move read queries by bounded-context value/risk, not all at once.
- Priority reads:
  - buyer purchase history
  - seller order dashboard
  - purchase detail/admin view
  - listing detail
  - approved listing search
  - pending listing moderation queue
  - seller listings
  - notifications inbox/count
- Lower priority reads can stay API temporarily:
  - static-ish counts
  - recent listings
  - featured/random listings
  - auth endpoints already working
- Keep HTTP-specific routes:
  - upload endpoints only if a specific file flow proves incompatible with server functions
  - external webhook/callback/public API endpoints if introduced
- Delete obsolete `apiFetch` wrappers.
- Rename product client query functions to listing language where feasible.

Acceptance criteria:

- No dead API routes for migrated workflows.
- Remaining API routes have clear HTTP-specific justification.

Tests:

- Full typecheck.
- Relevant unit tests.
- Manual smoke test for checkout/listings/orders/settings.

## Slice 10: Naming And Polish

Purpose: finish the migration language and remove compatibility leftovers.

Work:

- Rename domain-facing product language to listing.
- Ensure database/Prisma naming has converged from product to listing.
- Remove compatibility wrappers from `src/actions` and `src/data` where possible.
- Move remaining DTO/type imports away from global `src/types` into context DTOs.
- Add architecture notes if/when repo docs are back in scope.

Acceptance criteria:

- New code can be found by bounded context.
- Business rules are expressed in domain/application modules.
- Top-level `actions`/`data` are no longer the primary business architecture.

## Approved Deferred Work

- Cart remains client-side draft state for this migration. Revisit server-side cart aggregate only if future requirements include cross-device persistence, guest-account merging, stock reservation, shared carts, abandoned-cart workflows, or server-side promos/discounts.
- Product-to-listing persistence rename is approved for this architecture migration; track execution in the listing lifecycle/schema slice.
- Read-query migration priority approved; move high-value bounded-context reads first and leave low-value API reads temporarily.
- Upload workflow migration approved; use server functions where feasible and document any HTTP-only exception.
- Old Float money fields are dropped only after verified cents cutover; new `Purchase` / `SellerOrder` schema starts with cents.
- Future payment integration: add `payments` context with `Payment` / `PaymentAttempt` for provider refs, webhooks, idempotency, authorization/capture/refund attempts, and raw provider status mapping.
