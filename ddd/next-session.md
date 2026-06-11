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

Start Slice `1`: `PlacePurchase` vertical path.

Exact next task:

- Apply or verify the new product money migration against a real local database before relying on Prisma runtime behavior.
- Add domain models/tests for the minimal purchase-placement behavior:
  - `Listing` purchase checks: approved/orderable, stock availability, stock reduction.
  - `Purchase`: customer ID, purchase number, total `Money`, manual-payment status, shipping/contact snapshot, `PurchasePlaced` event.
  - `SellerOrder`: seller ID, item snapshots, subtotal `Money`, status, nullable tracking number, seller permissions.
- Add a `PlacePurchase` use-case test suite with fake ports before wiring Prisma.
- Define the first application ports:
  - `ListingsForPurchasePort.reserveForPurchase(...)`
  - purchase persistence
  - seller-order persistence
  - purchase number generation
  - notification projection inside the same transaction
- Keep old API/cart reads as compatibility until the vertical path proves out.

Useful first inspection targets:

- `ddd/migration-plan.md` Slice `1`
- `src/domains/shared/domain/money.ts`
- `src/domains/shared/application/unit-of-work.ts`
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

- Minimal `Listing`, `Purchase`, and `SellerOrder` domain behavior for purchase placement is covered by unit tests.
- `PlacePurchase` use case exists with fake-port tests proving:
  - customer-only placement
  - missing/unapproved/insufficient-stock rejection
  - multi-seller grouping into independent seller orders
  - purchase total and seller subtotals use integer-cent `Money`
  - manual-payment policy creates seller orders as ready for fulfillment
- Initial application port contracts exist without leaking Prisma records into domain/application tests.
- No Prisma purchase/seller-order persistence is required until the fake-port use-case contract is clear.
- `ddd/progress.md` updated with:
  - work completed
  - files changed
  - tests/checks run and results
  - decisions made
  - blockers or risks
- `ddd/next-session.md` updated with the exact next recommended task.
