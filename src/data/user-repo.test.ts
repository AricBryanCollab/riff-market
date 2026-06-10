import { afterEach, describe, expect, it, vi } from "vitest";

const { loggerMock, prismaMock, randomUUIDMock, txMock } = vi.hoisted(() => {
	const txMock = {
		mediaCleanupJob: {
			createMany: vi.fn(),
		},
		product: {
			findMany: vi.fn(),
		},
		user: {
			delete: vi.fn(),
		},
		userSettings: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
		},
	};
	const prismaMock = {
		$transaction: vi.fn(),
		user: {
			findMany: vi.fn(),
		},
		userSettings: {
			findMany: vi.fn(),
			findUnique: vi.fn(),
			upsert: vi.fn(),
		},
	};
	const loggerMock = {
		error: vi.fn(),
	};
	const randomUUIDMock = vi.fn(() => "cleanup-batch-1");

	return { loggerMock, prismaMock, randomUUIDMock, txMock };
});

vi.mock("node:crypto", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:crypto")>();

	return {
		...actual,
		default: {
			...actual,
			randomUUID: randomUUIDMock,
		},
		randomUUID: randomUUIDMock,
	};
});

vi.mock("@/data/connect-db", () => ({
	prisma: prismaMock,
}));

vi.mock("@/lib/logger", () => ({
	logger: loggerMock,
}));

import { MediaCleanupJobSourceType } from "generated/prisma/client";
import { deleteUserAndEnqueueMediaCleanupJobs } from "./user-repo";

describe("user repo", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("creates media cleanup jobs before deleting the user in one transaction", async () => {
		prismaMock.$transaction.mockImplementation(async (runner) =>
			runner(txMock),
		);
		txMock.userSettings.findUnique.mockResolvedValue({
			id: "settings-1",
			profilePic: {
				url: "https://res.cloudinary.com/riff/image/upload/avatar.jpg",
				publicId: " avatars/user-1 ",
			},
		});
		txMock.product.findMany.mockResolvedValue([
			{
				id: "product-1",
				images: [
					{
						url: "https://res.cloudinary.com/riff/image/upload/products/one.jpg",
						publicId: "products/one",
					},
					{
						url: "https://res.cloudinary.com/riff/image/upload/products/two.jpg",
						provider: "CLOUDINARY",
						assetType: "IMAGE",
						providerAssetId: " products/two ",
					},
					{
						url: "https://res.cloudinary.com/riff/image/upload/products/two-copy.jpg",
						publicId: "products/two",
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
		txMock.mediaCleanupJob.createMany.mockResolvedValue({ count: 3 });
		txMock.user.delete.mockResolvedValue({ id: "user-1" });

		await deleteUserAndEnqueueMediaCleanupJobs("user-1");

		expect(randomUUIDMock).toHaveBeenCalledOnce();
		expect(prismaMock.$transaction).toHaveBeenCalledOnce();
		expect(txMock.userSettings.findUnique).toHaveBeenCalledWith({
			where: { userId: "user-1" },
			select: {
				id: true,
				profilePic: true,
			},
		});
		expect(txMock.product.findMany).toHaveBeenCalledWith({
			where: { sellerId: "user-1" },
			select: {
				id: true,
				images: true,
			},
		});
		expect(txMock.mediaCleanupJob.createMany).toHaveBeenCalledWith({
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
					providerAssetId: "products/one",
					sourceType: MediaCleanupJobSourceType.PRODUCT,
					sourceId: "product-1",
					sourceUserId: "user-1",
				},
				{
					cleanupBatchId: "cleanup-batch-1",
					provider: "cloudinary",
					assetType: "image",
					providerAssetId: "products/two",
					sourceType: MediaCleanupJobSourceType.PRODUCT,
					sourceId: "product-1",
					sourceUserId: "user-1",
				},
			],
		});
		expect(txMock.user.delete).toHaveBeenCalledWith({
			where: { id: "user-1" },
		});
		expect(
			txMock.mediaCleanupJob.createMany.mock.invocationCallOrder[0],
		).toBeLessThan(txMock.user.delete.mock.invocationCallOrder[0]);
	});

	it("deletes the user without creating cleanup jobs when no supported image refs exist", async () => {
		prismaMock.$transaction.mockImplementation(async (runner) =>
			runner(txMock),
		);
		txMock.userSettings.findUnique.mockResolvedValue(null);
		txMock.product.findMany.mockResolvedValue([
			{
				id: "product-1",
				images: [
					"https://legacy.example.com/image.jpg",
					{
						url: "https://cdn.example.com/assets/one.jpg",
						provider: "unsupported-cdn",
						assetType: "image",
						providerAssetId: "assets/one",
					},
				],
			},
		]);
		txMock.user.delete.mockResolvedValue({ id: "user-1" });

		await deleteUserAndEnqueueMediaCleanupJobs("user-1");

		expect(txMock.mediaCleanupJob.createMany).not.toHaveBeenCalled();
		expect(txMock.user.delete).toHaveBeenCalledWith({
			where: { id: "user-1" },
		});
	});
});
