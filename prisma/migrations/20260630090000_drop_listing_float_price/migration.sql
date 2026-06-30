UPDATE "Listing"
SET "priceCents" = ROUND("price" * 100)::INTEGER
WHERE "priceCents" IS NULL;

ALTER TABLE "Listing" ALTER COLUMN "priceCents" SET NOT NULL;

ALTER TABLE "Listing"
ADD CONSTRAINT "Listing_priceCents_nonnegative_check" CHECK ("priceCents" >= 0);

ALTER TABLE "Listing" DROP COLUMN "price";
