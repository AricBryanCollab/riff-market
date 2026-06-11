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

## Latest Session Notes

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

## Files Changed In Latest Session

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

## Tests And Checks In Latest Session

- `bun run test:unit -- src/domains/listings/application/product-money.test.ts` passed: 1 file, 9 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bun run db:generate` passed.
- `bun run test:unit -- src/domains/listings/application/product-money.test.ts src/actions/product.test.ts src/domains/shared/domain/money.test.ts src/actions/order.test.ts` passed: 4 files, 82 tests.
- `bun run typecheck` passed.
- `bunx biome check <touched implementation files>` passed.
- `bun run docs:check` passed.
- `bun run test:unit` passed: 12 files, 126 tests.
- `env DATABASE_URL=postgresql://user:pass@localhost:5432/riff bunx prisma validate` passed.

## Decisions In Latest Session

- Keep public product response compatibility by continuing to expose decimal `price`, normalized from `priceCents` when available.
- Keep `priceCents` nullable during the transition so older rows and out-of-band writes do not break before full cutover.
- Use `USD` as the transitional product currency code.
- Do not migrate old fake `Order` / `OrderItem` Float money fields in Slice `0.5`.
- Keep existing cart/order compatibility for now by normalizing product repo reads rather than rewriting checkout.

## Risks / Follow-Ups From Latest Session

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
- [ ] Exact next task: start Slice `1` with the `PlacePurchase` vertical path, beginning with listing/purchase/seller-order domain models and fake-port use-case tests before wiring Prisma.
- [ ] Update this progress log at the end of each future session.
