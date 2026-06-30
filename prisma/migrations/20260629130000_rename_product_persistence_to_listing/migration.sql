ALTER TYPE "ProductCategory" RENAME TO "ListingCategory";
ALTER TYPE "ProductCondtion" RENAME TO "ListingCondition";

ALTER TABLE "Product" RENAME TO "Listing";
ALTER TABLE "Listing" RENAME CONSTRAINT "Product_pkey" TO "Listing_pkey";
ALTER TABLE "Listing" RENAME CONSTRAINT "Product_sellerId_fkey" TO "Listing_sellerId_fkey";

ALTER INDEX "Product_sellerId_idx" RENAME TO "Listing_sellerId_idx";
ALTER INDEX "Product_category_idx" RENAME TO "Listing_category_idx";
ALTER INDEX "Product_priceCents_idx" RENAME TO "Listing_priceCents_idx";
ALTER INDEX "Product_isApproved_idx" RENAME TO "Listing_isApproved_idx";
ALTER INDEX "Product_listingStatus_idx" RENAME TO "Listing_listingStatus_idx";

ALTER TABLE "OrderItem" RENAME COLUMN "productId" TO "listingId";
ALTER TABLE "OrderItem" RENAME CONSTRAINT "OrderItem_productId_fkey" TO "OrderItem_listingId_fkey";
ALTER INDEX "OrderItem_productId_idx" RENAME TO "OrderItem_listingId_idx";

ALTER TABLE "Review" RENAME COLUMN "productId" TO "listingId";
ALTER TABLE "Review" RENAME CONSTRAINT "Review_productId_fkey" TO "Review_listingId_fkey";
ALTER INDEX "Review_productId_idx" RENAME TO "Review_listingId_idx";
ALTER INDEX "Review_userId_productId_key" RENAME TO "Review_userId_listingId_key";

ALTER TABLE "Favorite" RENAME COLUMN "productId" TO "listingId";
ALTER TABLE "Favorite" RENAME CONSTRAINT "Favorite_productId_fkey" TO "Favorite_listingId_fkey";
ALTER INDEX "Favorite_productId_idx" RENAME TO "Favorite_listingId_idx";
ALTER INDEX "Favorite_userId_productId_key" RENAME TO "Favorite_userId_listingId_key";
