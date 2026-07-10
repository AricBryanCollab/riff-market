DELETE FROM "Notification" WHERE "orderId" IS NOT NULL;

ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_orderId_fkey";
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "orderId";

DROP TABLE IF EXISTS "OrderItem";
DROP TABLE IF EXISTS "Order";

DROP TYPE IF EXISTS "OrderStatus";
DROP TYPE IF EXISTS "PaymentMethod";
