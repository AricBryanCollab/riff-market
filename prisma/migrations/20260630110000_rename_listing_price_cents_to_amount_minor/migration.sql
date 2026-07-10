ALTER TABLE "Listing" RENAME COLUMN "priceCents" TO "priceAmountMinor";

ALTER INDEX "Listing_priceCents_idx" RENAME TO "Listing_priceAmountMinor_idx";

ALTER TABLE "Listing"
RENAME CONSTRAINT "Listing_priceCents_nonnegative_check" TO "Listing_priceAmountMinor_nonnegative_check";
