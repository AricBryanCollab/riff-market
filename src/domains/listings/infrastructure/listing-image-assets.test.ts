import { afterEach, describe, expect, it, type Mock, vi } from "vitest";
import type { ListingMediaCleanupStagingPort } from "@/domains/media/application/stage-listing-media-cleanup";
import type { ImageAssetRef } from "@/types/image-asset";

const { cloudinaryMock, compressImageMock } = vi.hoisted(() => {
	const cloudinaryMock = {
		deleteImage: vi.fn(),
		unsignedUploadImage: vi.fn(),
	} as const;
	const compressImageMock = vi.fn();

	return {
		cloudinaryMock,
		compressImageMock,
	};
});

vi.mock("@/env", () => ({
	env: {
		CLOUDINARY_UPLOAD_PRESET: "test-preset",
	},
}));

vi.mock("@/utils/cloudinary", () => cloudinaryMock);
vi.mock("@/utils/compress-image", () => ({
	compressImage: compressImageMock,
}));

import { CloudinaryListingImageManager } from "./listing-image-assets";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function makeImage(name: string) {
	return new File([`bytes-${name}`], name, {
		type: "image/jpeg",
	});
}

function makeUploadResult(filename: string) {
	return {
		secure_url: `https://cdn.example.com/${filename}`,
		public_id: filename.split(".")[0],
	};
}

function makeImageAssetRef(url: string) {
	return {
		url,
		publicId:
			url
				.split("/")
				.pop()
				?.replace(/\.[^/.]+$/, "") ?? "",
	};
}

function withCompressedImage(): Promise<{
	buffer: Buffer;
	originalSize: number;
	compressedSize: number;
	mime: string;
}> {
	return Promise.resolve({
		buffer: Buffer.from("compressed"),
		originalSize: 10,
		compressedSize: 8,
		mime: "image/jpeg",
	});
}

describe("listing image assets", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("uploads listing images using bounded parallelism", async () => {
		const imageManager = new CloudinaryListingImageManager();
		const files = [
			makeImage("img-1.jpg"),
			makeImage("img-2.jpg"),
			makeImage("img-3.jpg"),
			makeImage("img-4.jpg"),
			makeImage("img-5.jpg"),
		];
		(compressImageMock as Mock).mockImplementation(withCompressedImage);

		let activeUploads = 0;
		let maxActiveUploads = 0;
		(cloudinaryMock.unsignedUploadImage as Mock).mockImplementation(
			async ({ filename }) => {
				activeUploads += 1;
				maxActiveUploads = Math.max(maxActiveUploads, activeUploads);
				await sleep(10);
				activeUploads -= 1;

				return makeUploadResult(filename);
			},
		);

		const result = await imageManager.uploadImages(files);

		expect(result).toEqual([
			makeImageAssetRef("https://cdn.example.com/img-1.jpg"),
			makeImageAssetRef("https://cdn.example.com/img-2.jpg"),
			makeImageAssetRef("https://cdn.example.com/img-3.jpg"),
			makeImageAssetRef("https://cdn.example.com/img-4.jpg"),
			makeImageAssetRef("https://cdn.example.com/img-5.jpg"),
		]);
		expect(cloudinaryMock.unsignedUploadImage).toHaveBeenCalledTimes(
			files.length,
		);
		expect(maxActiveUploads).toBeLessThanOrEqual(3);
		expect(maxActiveUploads).toBeGreaterThan(1);
	});

	it("cleans up uploaded images when an upload fails", async () => {
		const imageManager = new CloudinaryListingImageManager();
		const files = [makeImage("img-1.jpg"), makeImage("img-2.jpg")];
		(compressImageMock as Mock).mockImplementation(withCompressedImage);
		(cloudinaryMock.unsignedUploadImage as Mock).mockImplementation(
			async ({ filename }) => {
				if (filename === "img-2.jpg") {
					await sleep(10);
					throw new Error("upload failed");
				}

				await sleep(1);
				return makeUploadResult(filename);
			},
		);

		await expect(imageManager.uploadImages(files)).rejects.toThrow(
			"upload failed",
		);
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("img-1");
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledTimes(1);
	});

	it("settles uploaded image cleanup as a best-effort image manager operation", async () => {
		const imageManager = new CloudinaryListingImageManager();
		const images: ImageAssetRef[] = [
			makeImageAssetRef("https://cdn.example.com/old-1.jpg"),
			makeImageAssetRef("https://cdn.example.com/old-2.jpg"),
		];
		(cloudinaryMock.deleteImage as Mock).mockImplementation(
			async (publicId: string) => {
				if (publicId === "old-2") {
					throw new Error("delete failed");
				}
			},
		);

		await expect(
			imageManager.cleanupUploadedImagesBestEffort(images),
		).resolves.toBeUndefined();
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old-1");
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old-2");
	});

	it("stages source-aware listing image cleanup instead of deleting immediately", async () => {
		const staging: ListingMediaCleanupStagingPort = {
			stageListingMediaCleanupJobs: vi.fn(async () => undefined),
		};
		const imageManager = new CloudinaryListingImageManager(staging);
		const images: ImageAssetRef[] = [
			makeImageAssetRef("https://cdn.example.com/old-1.jpg"),
		];

		await imageManager.cleanupPersistedImagesBestEffort(images, {
			listingId: "listing-1",
			sellerId: "seller-1",
		});

		expect(staging.stageListingMediaCleanupJobs).toHaveBeenCalledWith([
			{
				cleanupBatchId: expect.any(String),
				listingId: "listing-1",
				sellerId: "seller-1",
				asset: {
					url: "https://cdn.example.com/old-1.jpg",
					provider: "cloudinary",
					assetType: "image",
					providerAssetId: "old-1",
				},
			},
		]);
		expect(cloudinaryMock.deleteImage).not.toHaveBeenCalled();
	});

	it("deletes persisted listing images immediately when cleanup staging is unavailable", async () => {
		const imageManager = new CloudinaryListingImageManager();
		const images: ImageAssetRef[] = [
			makeImageAssetRef("https://cdn.example.com/old-1.jpg"),
			makeImageAssetRef("https://cdn.example.com/old-2.jpg"),
		];

		await expect(
			imageManager.cleanupPersistedImagesBestEffort(images, {
				listingId: "listing-1",
				sellerId: "seller-1",
			}),
		).resolves.toBeUndefined();

		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old-1");
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old-2");
	});

	it("falls back to immediate deletion when persisted cleanup staging fails", async () => {
		const staging: ListingMediaCleanupStagingPort = {
			stageListingMediaCleanupJobs: vi.fn(async () => {
				throw new Error("database unavailable");
			}),
		};
		const imageManager = new CloudinaryListingImageManager(staging);
		const images: ImageAssetRef[] = [
			makeImageAssetRef("https://cdn.example.com/old-1.jpg"),
		];

		await expect(
			imageManager.cleanupPersistedImagesBestEffort(images, {
				listingId: "listing-1",
				sellerId: "seller-1",
			}),
		).resolves.toBeUndefined();

		expect(staging.stageListingMediaCleanupJobs).toHaveBeenCalledTimes(1);
		expect(cloudinaryMock.deleteImage).toHaveBeenCalledWith("old-1");
	});
});
