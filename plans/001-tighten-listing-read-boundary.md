# Plan 001: Tighten the listing read boundary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report; do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
>
> ```bash
> git diff --stat e696731 -- src/domains/listings/application/listing-read-models.ts src/domains/listings/dto/listing-read-model.ts src/domains/listings/infrastructure/prisma-listing-read-models.ts src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts src/server/listing-read-service.ts src/server/listing-read-service.test.ts src/lib/zod/product-validation.ts ddd/progress.md ddd/next-session.md
> ```
>
> This plan was written against commit `e696731` plus the uncommitted Slice 4
> listing-read worktree on 2026-06-18. If any in-scope file has changed since
> this plan was written, compare the "Current state" excerpts against the live
> code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt, migration
- **Planned at**: commit `e696731`, 2026-06-18

## Why this matters

The current Slice 4 work correctly moves `/api/products` and
`/api/products/$id` reads behind listing use cases, but the new listing read
boundary still returns a product-shaped DTO directly and still imports the old
product query schema. If more routes are migrated on top of this shape, the
listing context will inherit the old `Product` API vocabulary as its internal
contract. This plan makes the temporary product compatibility explicit at the
delivery edge while keeping listing application and infrastructure code on a
typed listing query/read model boundary.

## Current state

Relevant files:

- `src/domains/listings/application/listing-read-models.ts` - listing query use cases and ports.
- `src/domains/listings/dto/listing-read-model.ts` - listing read DTO type.
- `src/domains/listings/infrastructure/prisma-listing-read-models.ts` - Prisma read-model adapter still backed by `Product` persistence during the migration.
- `src/server/listing-read-service.ts` - product API compatibility service for `/api/products` and `/api/products/$id`.
- `src/lib/zod/product-validation.ts` - old product validation module currently providing the approved-search query schema.

Current excerpts:

`src/server/listing-read-service.ts:8-9` imports listing DTOs but still parses
search through the product validation module:

```ts
import type { ListingReadModel } from "@/domains/listings/dto/listing-read-model";
import { getProductQuerySchema } from "@/lib/zod/product-validation";
```

`src/server/listing-read-service.ts:52-56` exposes the listing read result
directly as the product API result:

```ts
export async function getApprovedListingsForProductApi(
	rawQuery: unknown,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadModel[] | ProductApiReadError> {
	const parsed = getProductQuerySchema.safeParse(rawQuery);
```

`src/domains/listings/dto/listing-read-model.ts:7-24` defines
`ListingReadModel` with product compatibility and transitional persistence
fields mixed into the listing DTO:

```ts
export type ListingReadModel = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: string;
	readonly condition: string;
	readonly brand: string;
	readonly model: string;
	readonly images: string[];
	readonly description: string;
	readonly price: number;
	readonly priceCents?: number | null;
	readonly currencyCode?: string | null;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus: ListingReadStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
```

`src/domains/listings/application/listing-read-models.ts:20-29` lets the
application query accept arbitrary strings:

```ts
export type ApprovedListingSearchQuery = {
	readonly limit?: number;
	readonly offset?: number;
	readonly random?: boolean;
	readonly category?: string;
	readonly condition?: string;
	readonly brand?: string;
	readonly search?: string;
	readonly priceMinCents?: number;
	readonly priceMaxCents?: number;
};
```

`src/domains/listings/infrastructure/prisma-listing-read-models.ts:108-115`
then casts those strings into product enum types:

```ts
...(query.category && {
	category: query.category as ProductCategory,
}),
...(query.condition && {
	condition: query.condition as ProductCondition,
}),
```

Repo conventions to preserve:

- DDD modules are under `src/domains/<context>/{domain,application,infrastructure,dto}`.
- Application ports live in `application`, DTOs and external schemas live in `dto`, and Prisma adapters live in `infrastructure`.
- Existing server/service tests use dependency injection rather than importing the real Prisma adapter.
- The compatibility product routes must keep the existing response shape while the UI still calls product URLs.
- Product API route compatibility must keep missing detail reads as HTTP `404` with `"Product not found"`.

## Commands you will need

| Purpose | Command | Expected on success |
| --- | --- | --- |
| Typecheck | `PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run typecheck` | exit 0, no TypeScript errors |
| Focused tests | `PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run test:unit -- src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts src/server/listing-read-service.test.ts src/actions/product.test.ts src/data/product-repo.prisma.test.ts` | exit 0; DB-gated tests may be skipped unless `RUN_DB_TESTS=1` |
| Biome check | `bunx biome check src/domains/listings/application/listing-read-models.ts src/domains/listings/dto/listing-read-model.ts src/domains/listings/infrastructure/prisma-listing-read-models.ts src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts src/server/listing-read-service.ts src/server/listing-read-service.test.ts src/lib/zod/product-validation.ts` | exit 0, no fixes applied |
| Docs check, if DDD docs changed | `bun run docs:check` | exit 0, contradiction check passed |

The plain focused test command may fail in this environment with an older local
Node runtime error from Vite. Use the bundled Node `PATH=...` prefix shown above.

## Scope

**In scope**:

- `src/domains/listings/application/listing-read-models.ts`
- `src/domains/listings/dto/listing-read-model.ts`
- `src/domains/listings/infrastructure/prisma-listing-read-models.ts`
- `src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`
- `src/server/listing-read-service.ts`
- `src/server/listing-read-service.test.ts`
- `src/lib/zod/product-validation.ts`, only if a compatibility re-export is needed
- `ddd/progress.md` and `ddd/next-session.md`, only for the required DDD handoff note after source changes

**Out of scope**:

- Do not migrate `src/routes/api/products.seller.ts`, `src/routes/api/products.pending.ts`, `src/routes/api/products.count.ts`, `src/routes/api/products.recent.ts`, or `src/routes/api/products.cart-details.ts` in this plan.
- Do not delete `src/actions/product.ts` or `src/data/product-repo.ts`; they still serve unmigrated reads.
- Do not rename Prisma `Product` persistence vocabulary.
- Do not change public `/api/products` or `/api/products/$id` response fields.
- Do not change listing command server functions.

## Git workflow

- Branch: keep the current branch unless the operator asks for a new one.
- Commit style, if committing later: lowercase `type: summary`, for example `ref: tighten listing read boundary`.
- Do not push or open a PR unless explicitly instructed.

## Steps

### Step 1: Move approved-search query parsing into the listings DTO layer

In `src/domains/listings/dto/listing-read-model.ts`, add the listing read query
schema and typed query output next to the read DTO. Keep compatibility with the
existing product API query parameters: `limit`, `offset`, `random`, `category`,
`condition`, `brand`, `search`, `priceMin`, and `priceMax`.

Use the current `getProductQuerySchema` behavior in
`src/lib/zod/product-validation.ts:71-101` as the behavior to preserve:

- default `limit` to `12`
- default `offset` to `0`
- parse `random === "true"`
- convert `priceMin` and `priceMax` to `priceMinCents` and `priceMaxCents`
- keep validation limits `limit >= 1`, `limit <= 100`, `offset >= 0`

Name the new schema something explicit, such as
`approvedListingProductApiQuerySchema`, because it is parsing a product API
compatibility request into a listing search query. Export a type such as
`ApprovedListingProductApiQuery`.

If `optionalPriceCentsSchema` is private inside `src/lib/zod/product-validation.ts`,
either move the reusable price parser into a listing DTO helper or duplicate the
small parser locally with tests. Do not import `getProductQuerySchema` into the
listing server service after this step.

**Verify**:

```bash
PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run typecheck
```

Expected: exit 0.

### Step 2: Type the listing search query before it reaches infrastructure

Update `ApprovedListingSearchQuery` in
`src/domains/listings/application/listing-read-models.ts` so `category` and
`condition` are not arbitrary strings. During the transition, it is acceptable
to reuse the existing enum aliases from `src/types/enum.ts`:

```ts
import type { ProductCategory, ProductCondition } from "@/types/enum";
```

Then change:

```ts
readonly category?: string;
readonly condition?: string;
```

to:

```ts
readonly category?: ProductCategory;
readonly condition?: ProductCondition;
```

Update the schema output or mapper from Step 1 to produce these typed values.
In `src/domains/listings/infrastructure/prisma-listing-read-models.ts`, remove
the casts at the Prisma boundary because the query is already typed.

**Verify**:

```bash
PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run test:unit -- src/server/listing-read-service.test.ts
```

Expected: the listing application and service tests pass.

### Step 3: Make product API compatibility mapping explicit

Do not return `ListingReadModel` directly from product API service functions.
Add a separate compatibility response type and mapper in
`src/server/listing-read-service.ts` or, if it remains framework-free, in
`src/domains/listings/dto/listing-read-model.ts`.

Suggested shape:

```ts
type ProductApiListingReadModel = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: ProductCategory;
	readonly condition: ProductCondition;
	readonly brand: string;
	readonly model: string;
	readonly images: string[];
	readonly description: string;
	readonly price: number;
	readonly priceCents?: number | null;
	readonly currencyCode?: string | null;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus: ListingReadStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
	readonly seller: ListingReadModel["seller"];
};
```

Then have:

- `getListingDetailsForProductApi(...)` return `ProductApiListingReadModel | ProductApiReadError`
- `getApprovedListingsForProductApi(...)` return `ProductApiListingReadModel[] | ProductApiReadError`
- tests assert that the mapper preserves the current product-compatible fields

Keep `ListingReadModel` as the listing-facing read DTO. If you decide not to
remove `isApproved` or `price` from `ListingReadModel` yet, add a short comment
on the compatibility mapper explaining that these fields are retained only while
the `/api/products` clients are still product-shaped.

**Verify**:

```bash
PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run test:unit -- src/server/listing-read-service.test.ts
```

Expected: all listing read service tests pass.

### Step 4: Add regression coverage for invalid compatibility query values

In `src/server/listing-read-service.test.ts`, add tests for at least:

- invalid `limit: "0"` returns `{ error: "Invalid product queries", details: ... }`
- invalid `category` or `condition` is rejected before `searchApproved` is called

If the existing product query schema did not validate category/condition values,
this is an intentional tightening at the listing boundary. Use
`ProductCategory` and `ProductCondition` from `src/types/enum.ts` as the allowed
sets during this migration.

**Verify**:

```bash
PATH=/Users/aricjiang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH bun run test:unit -- src/server/listing-read-service.test.ts
```

Expected: the test file passes and includes the new invalid-query cases.

### Step 5: Run focused checks and update DDD handoff docs if needed

Run the focused verification commands from "Commands you will need". If source
behavior changed beyond pure internal refactoring, update `ddd/progress.md` and
`ddd/next-session.md` with:

- work completed
- files changed
- tests/checks run and results
- decisions made
- blockers or risks
- exact next recommended task

Do not update DDD docs for a no-behavior-change internal cleanup unless the
operator has asked for handoff docs to stay current on every refactor.

**Verify**:

```bash
bunx biome check src/domains/listings/application/listing-read-models.ts src/domains/listings/dto/listing-read-model.ts src/domains/listings/infrastructure/prisma-listing-read-models.ts src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts src/server/listing-read-service.ts src/server/listing-read-service.test.ts src/lib/zod/product-validation.ts
```

Expected: exit 0, no fixes applied.

If DDD docs were changed:

```bash
bun run docs:check
```

Expected: exit 0, contradiction check passed.

## Test plan

Add or update tests in:

- `src/server/listing-read-service.test.ts`
  - successful product API query parsing still maps to listing search input
  - invalid `limit` returns product-compatible validation error
  - invalid `category` or `condition` is rejected before the port is called
  - detail `404` behavior remains unchanged
- `src/domains/listings/infrastructure/prisma-listing-read-models.prisma.test.ts`
  - existing gated DB tests should continue proving approved-only search,
    cent-price fallback, and non-public detail reads

Use the existing tests in those files as the structural pattern.

## Done criteria

All must hold:

- [x] `src/server/listing-read-service.ts` no longer imports `getProductQuerySchema`.
- [x] `ApprovedListingSearchQuery.category` and `.condition` are typed, not plain `string`.
- [x] `src/domains/listings/infrastructure/prisma-listing-read-models.ts` no longer casts `query.category as ProductCategory` or `query.condition as ProductCondition`.
- [x] Product API compatibility response mapping is explicit and tested.
- [x] `/api/products` and `/api/products/$id` public response shapes are unchanged.
- [x] Focused tests pass with bundled Node.
- [x] Typecheck passes with bundled Node.
- [x] Biome check passes.
- [x] `plans/README.md` status row is updated.

## STOP conditions

Stop and report if:

- The live code does not match the current-state excerpts above.
- Making category/condition typed requires broad enum renames outside listing read files.
- Preserving the current product API response shape requires touching UI hooks or route components.
- The change requires migrating seller/pending/count/recent/cart reads; that is a separate Slice 4 step.
- A verification command fails twice after a reasonable fix attempt.

## Maintenance notes

This refactor prepares the boundary for the next Slice 4 moves: seller listings,
pending moderation queue, counts, recent listings, and cart details. Reviewers
should check that the listing application layer remains framework-free and that
product API compatibility stays isolated to `src/server/listing-read-service.ts`
or explicitly named DTO mappers. When the UI stops calling product route names,
the product-compatible response mapper should be deleted rather than promoted
into the permanent listing read model.
