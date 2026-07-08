---
scope:
  - src/server/listing-query-service.ts
  - src/domains/listings/application/listing-queries.ts
  - src/domains/listings/infrastructure/prisma-listing-queries.ts
tags:
  - architecture
  - ddd
  - listings
  - queries
---

# Listing Query Read Paths

Listing reads split into two intentional paths. Do not add a use case just to
forward one port call with no authorization or read policy.

## Use case required

Route through `src/domains/listings/application/listing-queries.ts` when the
read enforces who may see what:

- `getListingDetails` — hides non-approved listings from non-admins
- `listSellerListings` — seller-only
- `listPendingModerationListings` — admin-only
- `listCartListings` — customer-only

The server adapter (`listing-query-service.ts`) validates transport input,
maps `Actor`, calls the use case, and shapes the response DTO.

## Server → port allowed

After boundary validation, `listing-query-service.ts` may call query ports
directly when the read is a dumb fetch with no extra application policy:

- approved listing search (`searchApproved`)
- recent approved listings (`listRecentApproved`)
- aggregate counts (`listPopularApprovedBrandCounts`,
  `countApprovedByCategory`, `countByStatus`)

These change no state and apply the same visibility rules in infrastructure
(approved-only filters, viewer capability enrichment).

## Viewer capabilities

`deriveListingViewerCapabilities` lives in the application layer and is called
from `prisma-listing-queries.ts` while mapping rows. That is intentional: the
rule is owned by application/domain code, but list/search reads do not need a
separate use-case hop to apply it.

## When adding a new listing read

- Role, ownership, or visibility rules → add or extend a use case in
  `listing-queries.ts`.
- Public browse or aggregate count with no extra policy → server may call the
  port after Zod/transport validation.
- If the new read would only wrap one port method and return its result, keep
  the server-to-port path; do not introduce a pass-through use case.

## Verify

- Reads with authorization still return `Result` errors from application code.
- Dumb reads still validate untrusted input only at the server boundary.
- Infrastructure still uses `deriveListingViewerCapabilities` for per-row UI
  flags; do not duplicate that logic in components or server services.
