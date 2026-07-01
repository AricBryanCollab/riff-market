-- Intentional marketplace-wide currency default decision: RiffMarket listing
-- prices and order money snapshots default to TWD until multi-currency policy
-- and FX quote behavior are modeled explicitly.
ALTER TABLE "AppSettings" ALTER COLUMN "currency" SET DEFAULT 'TWD';
UPDATE "AppSettings" SET "currency" = 'TWD' WHERE "currency" = 'USD';

ALTER TABLE "Listing" ALTER COLUMN "currencyCode" SET DEFAULT 'TWD';
ALTER TABLE "Purchase" ALTER COLUMN "currencyCode" SET DEFAULT 'TWD';
ALTER TABLE "SellerOrder" ALTER COLUMN "currencyCode" SET DEFAULT 'TWD';
ALTER TABLE "SellerOrderItem" ALTER COLUMN "currencyCode" SET DEFAULT 'TWD';
