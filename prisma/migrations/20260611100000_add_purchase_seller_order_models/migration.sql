CREATE TYPE "PurchaseStatus" AS ENUM ('OPEN', 'CANCELED', 'COMPLETED');

CREATE TYPE "PaymentStatus" AS ENUM ('MANUALLY_CONFIRMED', 'PENDING_PAYMENT', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED');

CREATE TYPE "SellerOrderStatus" AS ENUM ('ON_HOLD_PAYMENT', 'NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELED');

CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "purchaseNumber" TEXT NOT NULL,
    "totalAmountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'MANUALLY_CONFIRMED',
    "status" "PurchaseStatus" NOT NULL DEFAULT 'OPEN',
    "buyerName" TEXT NOT NULL,
    "buyerEmail" TEXT NOT NULL,
    "buyerPhone" TEXT,
    "shippingAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Purchase_totalAmountCents_nonnegative" CHECK ("totalAmountCents" >= 0)
);

CREATE TABLE "SellerOrder" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "status" "SellerOrderStatus" NOT NULL DEFAULT 'NEW',
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerOrder_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SellerOrder_subtotalCents_nonnegative" CHECK ("subtotalCents" >= 0)
);

CREATE TABLE "SellerOrderItem" (
    "id" TEXT NOT NULL,
    "sellerOrderId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "listingName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "primaryImageUrl" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "sellerDisplayName" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subTotalCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerOrderItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SellerOrderItem_unitPriceCents_nonnegative" CHECK ("unitPriceCents" >= 0),
    CONSTRAINT "SellerOrderItem_subTotalCents_nonnegative" CHECK ("subTotalCents" >= 0),
    CONSTRAINT "SellerOrderItem_quantity_positive" CHECK ("quantity" > 0)
);

ALTER TABLE "Notification"
ADD COLUMN "purchaseId" TEXT,
ADD COLUMN "sellerOrderId" TEXT;

CREATE UNIQUE INDEX "Purchase_purchaseNumber_key" ON "Purchase"("purchaseNumber");

CREATE INDEX "Purchase_customerId_idx" ON "Purchase"("customerId");

CREATE INDEX "Purchase_createdAt_idx" ON "Purchase"("createdAt");

CREATE INDEX "SellerOrder_purchaseId_idx" ON "SellerOrder"("purchaseId");

CREATE INDEX "SellerOrder_sellerId_idx" ON "SellerOrder"("sellerId");

CREATE INDEX "SellerOrder_status_idx" ON "SellerOrder"("status");

CREATE INDEX "SellerOrder_createdAt_idx" ON "SellerOrder"("createdAt");

CREATE INDEX "SellerOrderItem_sellerOrderId_idx" ON "SellerOrderItem"("sellerOrderId");

CREATE INDEX "SellerOrderItem_listingId_idx" ON "SellerOrderItem"("listingId");

CREATE INDEX "SellerOrderItem_sellerId_idx" ON "SellerOrderItem"("sellerId");

CREATE INDEX "Notification_purchaseId_idx" ON "Notification"("purchaseId");

CREATE INDEX "Notification_sellerOrderId_idx" ON "Notification"("sellerOrderId");

ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SellerOrder" ADD CONSTRAINT "SellerOrder_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SellerOrderItem" ADD CONSTRAINT "SellerOrderItem_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sellerOrderId_fkey" FOREIGN KEY ("sellerOrderId") REFERENCES "SellerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
