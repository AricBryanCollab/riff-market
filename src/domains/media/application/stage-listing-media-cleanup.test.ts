import { describe, expect, it } from "vitest";
import type { CleanupImageAssetRef } from "@/types/image-asset";
import {
	type ListingMediaCleanupStagingPort,
	type StagedListingMediaCleanupJob,
	stageListingMediaForCleanup,
} from "./stage-listing-media-cleanup";

describe("stageListingMediaForCleanup", () => {
	it("stages unique listing image cleanup jobs", async () => {
		const staging = new InMemoryListingMediaCleanupStaging();

		const result = await stageListingMediaForCleanup(
			{
				cleanupBatchId: "batch-1",
				listingId: "listing-1",
				sellerId: "seller-1",
				assets: [
					cleanupImage("products/one"),
					cleanupImage("products/two"),
					cleanupImage("products/two"),
					cleanupImage(""),
				],
			},
			staging,
		);

		expect(result).toEqual({ stagedJobCount: 2 });
		expect(staging.stagedJobs).toEqual([
			{
				cleanupBatchId: "batch-1",
				listingId: "listing-1",
				sellerId: "seller-1",
				asset: cleanupImage("products/one"),
			},
			{
				cleanupBatchId: "batch-1",
				listingId: "listing-1",
				sellerId: "seller-1",
				asset: cleanupImage("products/two"),
			},
		]);
	});

	it("ignores listing images without cleanup target identifiers", async () => {
		const result = await stageListingMediaForCleanup(
			{
				cleanupBatchId: "batch-1",
				listingId: "listing-1",
				sellerId: "seller-1",
				assets: [cleanupImage("")],
			},
			{
				async stageListingMediaCleanupJobs(): Promise<void> {
					throw new Error("Invalid cleanup assets should not be staged");
				},
			},
		);

		expect(result).toEqual({ stagedJobCount: 0 });
	});
});

function cleanupImage(providerAssetId: string): CleanupImageAssetRef {
	return {
		url: `https://cdn.example.com/${providerAssetId}`,
		provider: "cloudinary",
		assetType: "image",
		providerAssetId,
	};
}

class InMemoryListingMediaCleanupStaging
	implements ListingMediaCleanupStagingPort
{
	readonly stagedJobs: StagedListingMediaCleanupJob[] = [];

	async stageListingMediaCleanupJobs(
		jobs: readonly StagedListingMediaCleanupJob[],
	): Promise<void> {
		this.stagedJobs.push(...jobs);
	}
}
