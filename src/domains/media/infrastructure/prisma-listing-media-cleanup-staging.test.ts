import { MediaCleanupJobSourceType } from "generated/prisma/client";
import { describe, expect, it, vi } from "vitest";
import { stageListingMediaForCleanup } from "@/domains/media/application/stage-listing-media-cleanup";
import { PrismaListingMediaCleanupStaging } from "./prisma-listing-media-cleanup-staging";

describe("PrismaListingMediaCleanupStaging", () => {
	it("stages listing image cleanup jobs as product-sourced media cleanup rows", async () => {
		const db = createDb();

		await stageListingMediaForCleanup(
			{
				cleanupBatchId: "cleanup-batch-1",
				listingId: "listing-1",
				sellerId: "seller-1",
				assets: [
					{
						url: "https://res.cloudinary.com/riff/image/upload/products/one.jpg",
						provider: "cloudinary",
						assetType: "image",
						providerAssetId: "products/one",
					},
				],
			},
			new PrismaListingMediaCleanupStaging(db),
		);

		expect(db.mediaCleanupJob.createMany).toHaveBeenCalledWith({
			data: [
				{
					cleanupBatchId: "cleanup-batch-1",
					provider: "cloudinary",
					assetType: "image",
					providerAssetId: "products/one",
					sourceType: MediaCleanupJobSourceType.PRODUCT,
					sourceId: "listing-1",
					sourceUserId: "seller-1",
				},
			],
		});
	});
});

function createDb() {
	return {
		mediaCleanupJob: {
			createMany: vi.fn(),
		},
	};
}
