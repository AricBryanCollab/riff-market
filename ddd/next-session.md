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

Start Slice `0.5`: money persistence migration.

Exact next task:

- Add transitional `Product.priceCents` and `Product.currencyCode` persistence support while `Product` is still the schema name.
- Add deterministic mapper/backfill tests for converting existing Float prices to integer cents.
- Add create/update dual-write behavior for product/listing prices so live product writes populate both the old Float field and the new cent field during transition.
- Update read mappers to prefer cents when present and fall back to Float only as migration compatibility.
- Do not migrate old fake `Order` / `OrderItem` Float money fields unless temporary compatibility proves unavoidable.

Useful first inspection targets:

- `prisma/schema.prisma`
- `src/data/product-repo.ts`
- `src/actions/product.ts`
- `src/actions/product.test.ts`
- `src/lib/zod/product-validation.ts`
- `src/utils/validate-product-search.ts`
- `src/hooks/use-create-product.ts`
- `src/hooks/use-update-product.ts`
- checkout/cart product price readers, especially `src/actions/order.ts` and `src/routes/api/products.cart-details.ts`

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

- Slice `-1` and Slice `0` initial implementation are complete.
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

Latest checks:

- `bun run test:unit -- src/actions/order.test.ts` passed.
- `bun run typecheck` passed.
- `bunx biome check src/actions/order.ts src/actions/order.test.ts 'src/routes/api/orders.$id.ts'` passed.
- `bun run test:unit -- src/domains/shared/domain/money.test.ts src/actions/order.test.ts` passed.
- `bun run test:unit` passed.
- `bunx biome check <touched files>` passed.
- Full `bun run check` still reports unrelated pre-existing formatting issues outside the touched files.

## Expected End State For Next Session

- Transitional product/listing cent fields added and generated Prisma types updated.
- Float-to-cent mapper/backfill behavior covered by focused tests.
- Product create/update paths dual-write Float and cent fields during transition.
- Product reads prefer cent fields when present and use Float fallback only as a temporary migration bridge.
- Old fake `Order` / `OrderItem` Float money fields are not migrated unless a concrete compatibility blocker is found.
- `ddd/progress.md` updated with:
  - work completed
  - files changed
  - tests/checks run and results
  - decisions made
  - blockers or risks
- `ddd/next-session.md` updated with the exact next recommended task.
