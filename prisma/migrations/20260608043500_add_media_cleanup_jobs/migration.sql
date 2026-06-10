-- CreateEnum
CREATE TYPE "MediaCleanupJobStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MediaCleanupJobSourceType" AS ENUM ('USER_PROFILE', 'PRODUCT');

-- CreateTable
CREATE TABLE "MediaCleanupJob" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "providerAssetId" TEXT NOT NULL,
    "sourceType" "MediaCleanupJobSourceType" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "status" "MediaCleanupJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lockedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaCleanupJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaCleanupJob_provider_assetType_providerAssetId_key" ON "MediaCleanupJob"("provider", "assetType", "providerAssetId");

-- CreateIndex
CREATE INDEX "MediaCleanupJob_status_runAt_createdAt_id_idx" ON "MediaCleanupJob"("status", "runAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "MediaCleanupJob_status_lockedUntil_idx" ON "MediaCleanupJob"("status", "lockedUntil");

-- CreateIndex
CREATE INDEX "MediaCleanupJob_sourceUserId_idx" ON "MediaCleanupJob"("sourceUserId");
