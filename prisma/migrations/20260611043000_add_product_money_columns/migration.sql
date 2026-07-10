ALTER TABLE "Product"
ADD COLUMN "priceCents" INTEGER,
ADD COLUMN "currencyCode" TEXT NOT NULL DEFAULT 'USD';

UPDATE "Product"
SET "priceCents" = ROUND("price" * 100)::INTEGER
WHERE "priceCents" IS NULL;

CREATE INDEX "Product_priceCents_idx" ON "Product"("priceCents");
