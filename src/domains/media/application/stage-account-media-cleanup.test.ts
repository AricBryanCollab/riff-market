import { describe, expect, it } from "vitest";
import type { CleanupImageAssetRef } from "@/types/image-asset";
import {
	type AccountMediaCleanupStagingPort,
	type AccountMediaInventory,
	type StagedAccountMediaCleanupJob,
	stageAccountMediaForCleanup,
} from "./stage-account-media-cleanup";

describe("stageAccountMediaForCleanup", () => {
	it("stages profile and product media cleanup jobs as one account media inventory", async () => {
		const staging = new InMemoryAccountMediaCleanupStaging({
			profile: {
				settingsId: "settings-1",
				profilePic: image("avatars/user-1"),
			},
			products: [
				{
					productId: "product-1",
					images: [
						image("products/one"),
						image("products/two"),
						image("products/two"),
						image(""),
					],
				},
			],
		});

		const result = await stageAccountMediaForCleanup(
			{ accountId: "user-1", cleanupBatchId: "batch-1" },
			staging,
		);

		expect(result).toEqual({ stagedJobCount: 3 });
		expect(staging.loadedAccountIds).toEqual(["user-1"]);
		expect(staging.stagedJobs).toEqual([
			{
				cleanupBatchId: "batch-1",
				accountId: "user-1",
				source: { kind: "profile", id: "settings-1" },
				asset: image("avatars/user-1"),
			},
			{
				cleanupBatchId: "batch-1",
				accountId: "user-1",
				source: { kind: "product", id: "product-1" },
				asset: image("products/one"),
			},
			{
				cleanupBatchId: "batch-1",
				accountId: "user-1",
				source: { kind: "product", id: "product-1" },
				asset: image("products/two"),
			},
		]);
	});

	it("does not call the staging port when there are no cleanup jobs", async () => {
		const staging = new InMemoryAccountMediaCleanupStaging({
			profile: null,
			products: [
				{
					productId: "product-1",
					images: [image("")],
				},
			],
		});

		const result = await stageAccountMediaForCleanup(
			{ accountId: "user-1", cleanupBatchId: "batch-1" },
			staging,
		);

		expect(result).toEqual({ stagedJobCount: 0 });
		expect(staging.stagedJobs).toEqual([]);
		expect(staging.stageCalls).toBe(0);
	});
});

function image(providerAssetId: string): CleanupImageAssetRef {
	return {
		url: `https://cdn.example.com/${providerAssetId}`,
		provider: "cloudinary",
		assetType: "image",
		providerAssetId,
	};
}

class InMemoryAccountMediaCleanupStaging
	implements AccountMediaCleanupStagingPort
{
	readonly loadedAccountIds: string[] = [];
	readonly stagedJobs: StagedAccountMediaCleanupJob[] = [];
	stageCalls = 0;

	constructor(private readonly inventory: AccountMediaInventory) {}

	async loadAccountMediaInventory(
		accountId: string,
	): Promise<AccountMediaInventory> {
		this.loadedAccountIds.push(accountId);
		return this.inventory;
	}

	async stageAccountMediaCleanupJobs(
		jobs: readonly StagedAccountMediaCleanupJob[],
	): Promise<void> {
		this.stageCalls += 1;
		this.stagedJobs.push(...jobs);
	}
}
