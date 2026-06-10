-- DropIndex
DROP INDEX "MediaCleanupJob_provider_assetType_providerAssetId_key";

-- AlterTable
ALTER TABLE "MediaCleanupJob" ADD COLUMN     "cleanupBatchId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MediaCleanupJob_cleanupBatchId_idx" ON "MediaCleanupJob"("cleanupBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCleanupJob_cleanupBatchId_provider_assetType_providerA_key" ON "MediaCleanupJob"("cleanupBatchId", "provider", "assetType", "providerAssetId");
