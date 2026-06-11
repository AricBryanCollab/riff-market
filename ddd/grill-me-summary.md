# DDD Grill-Me Answer Summary

Created: 2026-06-11

Purpose: this is the cleaned answer record from the DDD grill-me process. Use it as the canonical summary of approved decisions. Use `ddd/progress.md` only as the fresh implementation progress log. Historical adversarial review findings have already been incorporated here and into `ddd/migration-plan.md`.

## 1. Why DDD?

Approved answer:

Use DDD because the marketplace domain has enough business behavior and role-specific workflows to justify explicit domain boundaries. This is an architecture conversion, not folder reshuffling.

Goal:

- Make the code match the business model.
- Use a pragmatic modular monolith.
- Do not introduce microservices.

## 2. What Is The Core Domain?

Approved answer:

The core domain is the seller listing to customer purchase lifecycle:

- sellers create listings
- listings are moderated
- buyers discover approved listings
- buyers check out
- seller-specific orders are created
- sellers fulfill their part of the purchase

## 3. What Are Supporting Domains vs Aggregates?

Approved answer:

Supporting domains/bounded contexts are strategic boundaries. Aggregates are tactical consistency boundaries inside those contexts.

Bounded contexts:

- `listings`
- `ordering`
- `accounts`
- `reviews`
- `notifications`
- `media`

Future bounded context:

- `payments`

Aggregate roots/domain models:

- `Listing`
- `Purchase`
- `SellerOrder`
- `UserAccount`
- `Review`
- `MediaCleanupJob`

`Notification` is a local inbox/read model and use-case boundary for now, not a rich aggregate unless future behavior adds real invariants.

## 4. Should Product Become Listing?

Approved answer:

Yes. The current `Product` concept is really a seller-owned marketplace listing.

Final direction:

- Domain vocabulary: `Listing`
- Persistence vocabulary: rename `Product` to `Listing` during the migration
- Final architecture should not keep `Product` as persistence vocabulary

## 5. Target Module Structure

Approved answer:

Use:

```text
src/domains/<context>/
  domain/
  application/
  infrastructure/
  dto/
```

Layer meanings:

- `domain`: classes, value objects, domain events, business invariants
- `application`: use cases, command/query orchestration, ports, transaction boundaries
- `infrastructure`: Prisma repositories, storage adapters, provider implementations
- `dto`: request/response DTOs, Zod schemas for external input, mappers

React routes/components/hooks remain delivery/UI, not domain.

## 6. Should Domain Models Use Classes?

Approved answer:

Yes, where behavior/invariants matter.

Use classes for:

- aggregate roots
- entities
- value objects

Do not force classes for:

- React components
- hooks
- DTOs
- Zod schemas
- simple boundary data

## 7. What Is A DTO?

Approved answer:

`dto` holds boundary data shapes:

- request DTOs
- response DTOs
- Zod schemas for external input
- mappers between domain/read models and API-safe data

Ports do not belong in `dto`; ports belong in `application`.

## 8. Where Does Validation Belong?

Approved answer:

Use two validation layers:

Edge/DTO validation:

- external shape
- required fields
- enum parsing
- file constraints
- form/request parsing

Domain validation:

- business invariants
- impossible invalid states
- status transitions
- stock cannot go below zero
- listing must be approved/orderable before purchase

Domain code must not depend on Zod, React, FormData, Prisma, Request, or Response.

## 9. Delivery: API Routes Or Server Functions?

Approved answer:

Prefer TanStack server functions for migrated workflows. Keep API routes only temporarily or for true HTTP-specific needs.

Server functions are delivery adapters:

```text
React
  -> server function
    -> authenticate
    -> parse DTO
    -> build Actor
    -> call use case
```

Use cases remain framework-agnostic.

Upload workflows should move to server functions where feasible. Keep an HTTP-only exception only if a specific file flow proves incompatible.

## 10. How Should Cross-Context Coordination Work?

Approved answer:

Use server-side application use cases as coordinators.

Rule:

- React starts one command.
- Use case coordinates.
- Domain classes enforce rules.
- Repositories persist.
- Domain events record facts.
- Application handlers react to events.

Use outbox only later for reliable async/external delivery.

Local notification rows are created in the same database transaction for now.

## 11. What Is A Domain Event Here?

Approved answer:

A domain event records an important business fact that already happened.

Examples:

- `PurchasePlaced`
- `SellerOrderCreated`
- `SellerOrderStatusChanged`
- `ListingApproved`
- `ListingDeclined`

Events do not perform side effects themselves. Application handlers decide how to react.

## 12. What Is The Checkout Model?

Approved answer:

Use `Purchase` + independent `SellerOrder` aggregate roots.

`Purchase`:

- buyer-facing checkout aggregate
- owns customer, purchase number, total, payment status, purchase status, buyer contact/shipping snapshot

`SellerOrder`:

- seller-facing aggregate
- one per seller per purchase
- owns seller ID, seller item snapshots, seller subtotal, fulfillment status, tracking number, seller permissions

`PlacePurchase` can create `Purchase` and `SellerOrder` records in one application transaction, but they are still separate aggregates.

Buyer order history is a read model joining `Purchase` and `SellerOrder`.

Seller dashboard queries `SellerOrder` directly.

## 13. Should Purchase Store sellerOrderIds?

Approved answer:

No.

Use:

```text
SellerOrder.purchaseId
```

Read models derive seller orders by querying `SellerOrder.purchaseId`.

## 14. Purchase Payment Policy

Approved answer:

The current app does not capture real payment. Do not mark purchases as `PAID` just because a user selected `CASH`, `PAYPAL`, or `VISA`.

Current checkout:

```text
Purchase.paymentStatus = MANUALLY_CONFIRMED
SellerOrder.status = NEW
```

Meaning:

- current UX is preserved
- seller work is released immediately
- we do not falsely claim real payment capture

Future payment flow can use:

```text
Purchase.paymentStatus = PENDING_PAYMENT
SellerOrder.status = ON_HOLD_PAYMENT
```

Then release seller orders to `NEW` after payment policy allows fulfillment.

## 15. Approved Status Vocabularies

`PurchaseStatus`:

- `OPEN`
- `CANCELED`
- `COMPLETED`

`PaymentStatus`:

- `MANUALLY_CONFIRMED`
- `PENDING_PAYMENT`
- `AUTHORIZED`
- `PAID`
- `FAILED`
- `REFUNDED`

`SellerOrderStatus`:

- `ON_HOLD_PAYMENT`
- `NEW`
- `PROCESSING`
- `SHIPPED`
- `DELIVERED`
- `CANCELED`

Buyer-facing summary status is a read-model label derived from `Purchase.paymentStatus` and `SellerOrder.status[]`:

- `PENDING_PAYMENT`
- `OPEN`
- `PARTIALLY_SHIPPED`
- `SHIPPED`
- `DELIVERED`
- `PARTIALLY_CANCELED`
- `CANCELED`

## 16. Purchase Number vs Tracking Number

Approved answer:

Split them.

- `Purchase.purchaseNumber`: buyer-facing reference
- `SellerOrder.trackingNumber`: seller shipment tracking, nullable until shipped

Do not use one global tracking number for a multi-seller purchase.

## 17. Purchase Snapshot Fields

Approved `Purchase` buyer/contact/shipping snapshot:

- `buyerName`
- `buyerEmail`
- `buyerPhone`
- `shippingAddress`

## 18. SellerOrder Item Snapshot Fields

Approved fields:

- `listingId`
- `listingName`
- `brand`
- `model`
- `category`
- `condition`
- `primaryImageUrl`
- `sellerId`
- `sellerDisplayName`
- `unitPriceCents`
- `quantity`
- `subTotalCents`
- `currencyCode`

Reason:

Order history must survive listing edits, withdrawal, deletion, or seller profile changes.

## 19. Notifications

Approved answer:

Create local notification rows in the same transaction as purchase placement for now.

Notifications should carry both IDs where relevant:

- `purchaseId`
- `sellerOrderId`

Buyer notifications link primarily to `Purchase`.

Seller notifications link directly to `SellerOrder`.

## 20. Listing Status And Deletion

Approved `ListingStatus` enum:

- `PENDING`
- `APPROVED`
- `DECLINED`
- `WITHDRAWN`

Meanings:

- `PENDING`: seller submitted listing, awaiting moderation
- `APPROVED`: visible/searchable/orderable
- `DECLINED`: admin rejected listing
- `WITHDRAWN`: seller removed listing from sale or listing with history is no longer active

Hard delete:

- allowed only for safe draft/unreferenced listings

Do not hard-delete listings with transactional history, reviews, favorites, or meaningful references.

## 21. Money

Approved answer:

Use integer minor units/cents.

Domain:

```text
Money(amountCents, currencyCode)
```

Migration:

- first migrate listing/product price to cents
- create new `Purchase` / `SellerOrder` schema with cents from day one
- do not waste effort migrating old fake order Float fields unless temporary compatibility requires it
- drop old Float fields only after verified cents cutover

## 22. Explicit Ordering-To-Listings Boundary

Approved boundary:

```text
ListingsForPurchasePort.reserveForPurchase(...)
```

Responsibilities:

- runs inside active unit-of-work transaction
- checks listings exist
- checks listings are `APPROVED` and orderable
- aggregates duplicate listing IDs
- performs guarded stock decrement
- returns seller-grouped item snapshots
- does not expose Prisma records to `ordering`

## 23. Authorization

Approved answer:

Every externally callable adapter authenticates.

Every use case receives explicit `Actor` and authorizes.

Business permissions live in application/domain policies/classes.

UI helpers are display affordances only.

Known authorization gaps should be fixed when touched; do not preserve security bugs.

## 24. Cart

Approved answer:

Cart remains client-side draft state for this migration.

Future server-side cart aggregate may be needed for:

- cross-device persistence
- guest-to-account cart merging
- stock reservation
- shared carts
- abandoned cart workflows
- server-side discounts/promos

## 25. Read Query Migration

Approved priority reads to move to server functions:

- buyer purchase history
- seller order dashboard
- purchase detail/admin view
- listing detail
- approved listing search
- pending listing moderation queue
- seller listings
- notifications inbox/count

Lower priority reads can stay API temporarily:

- static-ish counts
- recent listings
- featured/random listings
- auth endpoints already working

## 26. Future Payments

Approved future direction:

Add `payments` context with `Payment` / `PaymentAttempt` before real Stripe/PayPal lifecycle is introduced.

It should own:

- provider refs
- webhook IDs
- idempotency
- authorization/capture/refund attempts
- raw provider status mapping

`Purchase` stores normalized provider-neutral payment state only.

## 27. Testing Strategy

Approved answer:

Use risk-focused characterization tests only.

Do not preserve old fake `Order` / `OrderItem` schema internals.

Keep tests for:

- checkout visible behavior
- notification expectations
- authorization gaps as security tests
- listing moderation behavior that intentionally changes

Rewrite surviving tests against `Purchase` / `SellerOrder` as soon as the new model exists.

`PlacePurchase` requires real DB integration/concurrency tests for guarded stock mutation.

## 28. Migration Slices

1. Slice `-1`: risk-focused characterization/security tests only.
2. Slice `0`: foundation: actor, domain events, result/errors, unit of work, money, import protection.
3. Slice `0.5`: listing/product price cents migration.
4. Slice `1`: `PlacePurchase` with `Purchase`, `SellerOrder`, listing reservation, guarded stock mutation, same-transaction notifications.
5. Slice `2`: seller-order lifecycle and purchase/seller-order read models.
6. Slice `3`: listing lifecycle and product-to-listing persistence rename.
7. Slice `4`: listing queries/read models.
8. Slice `5`: notifications.
9. Slice `6`: accounts.
10. Slice `7`: reviews.
11. Slice `8`: media.
12. Slice `9`: API route cleanup.
13. Slice `10`: naming and polish.

## 29. Implementation Guardrails

- Domain code must not import React, TanStack, Prisma, Zod, Request, Response, FormData, or Cloudinary.
- Server functions are delivery adapters only.
- Use cases receive explicit `Actor`.
- Repositories persist and map data; they do not orchestrate workflows.
- `PlacePurchase` must use a concrete unit-of-work/transaction boundary.
- Listing stock reservation must be guarded atomically in the database.
- Existing fake order schema/tests are not compatibility requirements.

## 30. Files To Read For Implementation

- `ddd/agent-handoff-protocol.md`
- `ddd/next-session.md`
- `ddd/migration-plan.md`
- `ddd/grill-me-summary.md`
- `ddd/progress.md`
