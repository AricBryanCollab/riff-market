---
scope:
  - src/domains/listings/**
  - src/server/listing-*
  - src/components/listing-card.tsx
  - src/components/cart-list.tsx
  - src/components/pending-listing-list.tsx
  - src/components/order-list.tsx
  - src/components/order/order-summary.*
  - src/components/home/featured-listing-card.tsx
  - src/components/home/hero-carousel.tsx
  - src/components/home/mocks.ts
  - src/components/sidebar/price-range-filters.tsx
  - src/hooks/use-cart-details.*
  - src/hooks/use-update-listing.ts
  - src/routes/cart.tsx
  - src/routes/checkout.tsx
  - src/routes/product/**
tags:
  - ddd
  - money
  - listings
---

# Listing Money Read Contract

Listing read and mutation responses expose Listing Price as
`priceAmountMinor` plus `currencyCode`. Do not add a serialized decimal
`price` field or `priceCents` compatibility alias to listing DTOs, server
responses, fixtures, or mocks.

RiffMarket currently prices Listings in TWD. Listing form and approved-search
price inputs accept whole TWD amounts and convert them to `priceAmountMinor`
before persistence or querying.

Do not drive the Marketplace Currency from an environment variable. Changing
the Marketplace Currency changes validation, database defaults, and persisted
price semantics, so it should be handled as an explicit model and migration
change.

UI components must render Listing Price by formatting `priceAmountMinor` with
`currencyCode`. Cart and checkout totals should sum integer minor amounts first,
then format the total for display.

Keep `currencyCode` in listing contracts even while the marketplace is TWD-only;
future multi-currency support should add explicit currency policy or FX quote
behavior instead of reintroducing decimal `price` fields.

Order and payment snapshot fields such as `unitPriceCents`, `subTotalCents`,
and `totalAmountCents` are outside this listing read-contract slice; do not
rename those fields as incidental cleanup.
