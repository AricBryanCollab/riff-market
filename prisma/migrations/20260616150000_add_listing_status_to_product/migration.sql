CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'WITHDRAWN');

ALTER TABLE "Product"
ADD COLUMN "listingStatus" "ListingStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "Product"
SET "listingStatus" = CASE
	WHEN "isApproved" = true THEN 'APPROVED'::"ListingStatus"
	ELSE 'PENDING'::"ListingStatus"
END;

CREATE INDEX "Product_listingStatus_idx" ON "Product"("listingStatus");
