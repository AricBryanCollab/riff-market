# Listing Money Read Contract

Listing prices are exposed from read and mutation responses as `priceAmountMinor` plus `currencyCode`, not as a derived decimal `price` or legacy `priceCents` alias. Decimal price values remain acceptable at human input boundaries such as listing forms and search filters, but persisted and serialized listing money uses the currency-agnostic minor amount so future currencies do not inherit USD-specific cents language or duplicate money representations.

RiffMarket currently treats TWD as the marketplace-wide default currency. The Prisma defaults for `AppSettings.currency`, `Listing.currencyCode`, and order money snapshot currency fields (`Purchase`, `SellerOrder`, and `SellerOrderItem`) are intentionally aligned to TWD; changing that default is a model and migration decision, not deploy-time configuration.
