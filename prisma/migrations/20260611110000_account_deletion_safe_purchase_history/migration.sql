ALTER TABLE "Purchase" ADD COLUMN "customerIdSnapshot" TEXT;

UPDATE "Purchase"
SET "customerIdSnapshot" = "customerId"
WHERE "customerIdSnapshot" IS NULL;

ALTER TABLE "Purchase" ALTER COLUMN "customerIdSnapshot" SET NOT NULL;

ALTER TABLE "SellerOrder" ADD COLUMN "sellerIdSnapshot" TEXT;

UPDATE "SellerOrder"
SET "sellerIdSnapshot" = "sellerId"
WHERE "sellerIdSnapshot" IS NULL;

ALTER TABLE "SellerOrder" ALTER COLUMN "sellerIdSnapshot" SET NOT NULL;

ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_customerId_fkey";

ALTER TABLE "Purchase" ALTER COLUMN "customerId" DROP NOT NULL;

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SellerOrder" DROP CONSTRAINT "SellerOrder_sellerId_fkey";

ALTER TABLE "SellerOrder" ALTER COLUMN "sellerId" DROP NOT NULL;

ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Purchase_customerIdSnapshot_idx" ON "Purchase"("customerIdSnapshot");

CREATE INDEX "SellerOrder_sellerIdSnapshot_idx" ON "SellerOrder"("sellerIdSnapshot");
