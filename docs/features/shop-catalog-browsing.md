# Shop Catalog Browsing
<!-- feature:def shop_catalog_browsing -->

---
feature_id: shop_catalog_browsing
owner_scope: marketplace
tags:
  - shop
  - catalog
  - search
  - filters
  - pagination
  - admin
status: active
last_reviewed: 2026-06-24
---

## Purpose
- Provide the main marketplace browse flow at `/shop` for finding approved products.
- Keep filter and paging state shareable through URL search params.

## Behavior Contract
- URL search is the source of truth for shop filters (`category`, `brand`, `condition`, `search`, `priceMin`, `priceMax`, `page`).
- Filter/search updates reset `page` and replace the current history entry.
- Page updates push a new history entry and omit `page` from URL when page is zero.
- `/shop` prefetches approved products and approved count during `beforeLoad`; failures are tolerated and rendered in-page.
- Pending products are fetched only when the current user is admin (`isAdmin`) and pending view is enabled.
- Admin-only `Pending` toggle is not URL-backed; it is local UI state in `usePendingProductStore`.

## Key Paths
- `src/routes/shop/index.tsx`
- `src/routes/shop/route.tsx`
- `src/hooks/use-shop-search-filters.ts`
- `src/hooks/use-shop-pagination.ts`
- `src/hooks/use-get-products.ts`
- `src/hooks/use-get-pending-products.ts`
- `src/server/listing-read.functions.ts`
- `src/components/shop-sidebar.tsx`
- `src/components/product-filter-badges.tsx`
- `src/components/page-headers.tsx`
- `src/utils/shop-search.ts`
- `src/utils/validate-product-search.ts`

## Data Flow / Dependencies
- Inputs: TanStack Router search params from `/shop/`.
- Outputs: product-compatible listing read server function input with `limit=8` and URL-derived filters.
- Query deps: React Query keys `['products', 'approved', filters]`, `['products', 'count', 'approved']`, and `['pendingProducts']`.
- State deps: `usePendingProductStore` controls pending/approved list switching.

## Change Log
- 2026-06-24: Updated catalog data-flow docs after product read delivery moved from `/api/products` to listing read server functions.
- 2026-02-17: Added URL-driven filters/pagination contract and admin pending behavior baseline.

## Test Impact / Verification Notes
- Run `bun run lint` and `bun run typecheck`.
- Manual checks: deep-link into filtered URL, back/forward after filter edits, and pagination navigation.
- Admin manual check: toggle `Pending` on/off and confirm non-admin sessions never fetch pending products.

## Known Risks / Gotchas
- `Pending` mode is not encoded in URL, so reload/share links return to approved view.
- Search updates are immediate and not debounced.
- Product count query is status-based (`approved`) and not filter-specific.
