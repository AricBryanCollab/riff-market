import { MediaCleanupJobSourceType } from "generated/prisma/client";
import { describe, expect, it, vi } from "vitest";
import { stageAccountMediaForCleanup } from "@/domains/media/application/stage-account-media-cleanup";
import { PrismaAccountMediaCleanupStaging } from "./prisma-account-media-cleanup-staging";

describe("PrismaAccountMediaCleanupStaging", () => {
	it("loads account media and stages normalized cleanup jobs", async () => {
		const db = createDb();
		db.userSettings.findUnique.mockResolvedValue({
			id: "settings-1",
			profilePic: {
				url: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
				publicId: " avatars/user-1 ",
			},
		});
		db.listing.findMany.mockResolvedValue([
			{
				id: "listing-1",
				images: [
					{
						url: "https://res.cloudinary.com/riff/image/upload/listings/one.jpg",
						publicId: "listings/one",
					},
					{
						url: "https://res.cloudinary.com/riff/image/upload/listings/two.jpg",
						provider: "CLOUDINARY",
						assetType: "IMAGE",
						providerAssetId: " listings/two ",
					},
					{
						url: "https://res.cloudinary.com/riff/image/upload/listings/two-copy.jpg",
						publicId: "listings/two",
					},
					{
						url: "https://cdn.example.com/assets/three.jpg",
						provider: "unsupported-cdn",
						assetType: "image",
						providerAssetId: "assets/three",
					},
				],
			},
		]);

		await stageAccountMediaForCleanup(
			{ accountId: "user-1", cleanupBatchId: "cleanup-batch-1" },
			new PrismaAccountMediaCleanupStaging(db),
		);

		expect(db.userSettings.findUnique).toHaveBeenCalledWith({
			where: { userId: "user-1" },
			select: {
				id: true,
				profilePic: true,
			},
		});
		expect(db.listing.findMany).toHaveBeenCalledWith({
			where: { sellerId: "user-1" },
			select: {
				id: true,
				images: true,
			},
		});
		expect(db.mediaCleanupJob.createMany).toHaveBeenCalledWith({
			data: [
				{
					cleanupBatchId: "cleanup-batch-1",
					provider: "cloudinary",
					assetType: "image",
					providerAssetId: "avatars/user-1",
					sourceType: MediaCleanupJobSourceType.USER_PROFILE,
					sourceId: "settings-1",
					sourceUserId: "user-1",
				},
				{
					cleanupBatchId: "cleanup-batch-1",
					provider: "cloudinary",
					assetType: "image",
					providerAssetId: "listings/one",
					sourceType: MediaCleanupJobSourceType.LISTING,
					sourceId: "listing-1",
					sourceUserId: "user-1",
				},
				{
					cleanupBatchId: "cleanup-batch-1",
					provider: "cloudinary",
					assetType: "image",
					providerAssetId: "listings/two",
					sourceType: MediaCleanupJobSourceType.LISTING,
					sourceId: "listing-1",
					sourceUserId: "user-1",
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
		listing: {
			findMany: vi.fn(),
		},
		userSettings: {
			findUnique: vi.fn(),
		},
	};
}
