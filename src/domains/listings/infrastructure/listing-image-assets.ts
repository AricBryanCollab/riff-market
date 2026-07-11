import { randomUUID } from "node:crypto";
import type {
	ListingImageCleanupSource,
	ListingImageManagerPort,
} from "@/domains/listings/application/manage-listing";
import {
	type ListingMediaCleanupStagingPort,
	stageListingMediaForCleanup,
} from "@/domains/media/application/stage-listing-media-cleanup";
import { env } from "@/env";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import type { CleanupImageAssetRef, ImageAssetRef } from "@/types/image-asset";
import { unsignedUploadImage } from "@/utils/cloudinary";
import { tryDeleteCloudinaryImageAssets } from "@/utils/cloudinary-assets";
import { compressImage } from "@/utils/compress-image";
import { toCleanupImageAssetRefFromImage } from "@/utils/image-asset-ref";

const MAX_LISTING_IMAGE_UPLOADS = 3;
const listingImageOptions = {
	maxSize: 2400,
	quality: 85,
	format: "jpeg",
} as const;

async function mapWithConcurrency<T, R>(
	items: T[],
	concurrency: number,
	mapFn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
	// This uses bounded async worker loops (via Promise workers), not Browser Worker API.
	// Each worker grabs the next pending item and processes it until none remain.
	if (items.length === 0) {
		return [];
	}

	const normalizedConcurrency = Math.max(
		1,
		Math.min(concurrency, items.length),
	);
	const results = new Array<R>(items.length);
	let nextIndex = 0;
	let firstError: unknown;

	const worker = async () => {
		while (nextIndex < items.length && firstError === undefined) {
			const index = nextIndex++;
			try {
				results[index] = await mapFn(items[index], index);
			} catch (error) {
				firstError ??= error;
			}
		}
	};

	await Promise.allSettled(
		Array.from({ length: normalizedConcurrency }, () => worker()),
	);

	if (firstError !== undefined) {
		throw firstError;
	}

	return results;
}

function getMissingUploadMetadataMessage(
	uploadResult: CloudinaryUploadResult | null | undefined,
) {
	const missingFields = [];

	if (!uploadResult?.secure_url) {
		missingFields.push("secure URL");
	}

	if (!uploadResult?.public_id) {
		missingFields.push("public ID");
	}

	return `Image upload did not return required ${missingFields.join(" and ")}`;
}

async function uploadListingImage(imageFile: File): Promise<ImageAssetRef> {
	const compressedImage = await compressImage({
		file: imageFile,
		options: listingImageOptions,
	});

	const uploadResult = (await unsignedUploadImage({
		buffer: compressedImage.buffer,
		filename: imageFile.name,
		uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
		folder: "listings",
	})) as CloudinaryUploadResult;

	if (!uploadResult?.secure_url || !uploadResult.public_id) {
		throw new Error(
			uploadResult?.error ?? getMissingUploadMetadataMessage(uploadResult),
		);
	}

	return {
		url: uploadResult.secure_url,
		publicId: uploadResult.public_id,
	};
}

async function uploadListingImages(
	imageFiles: File[],
): Promise<ImageAssetRef[]> {
	const uploadedImages: ImageAssetRef[] = [];

	try {
		const images = await mapWithConcurrency(
			imageFiles,
			MAX_LISTING_IMAGE_UPLOADS,
			async (imageFile) => {
				const image = await uploadListingImage(imageFile);
				uploadedImages.push(image);
				return image;
			},
		);

		return images;
	} catch (error) {
		await cleanupListingImagesBestEffort(uploadedImages);
		throw error;
	}
}

async function cleanupListingImagesBestEffort(images: ImageAssetRef[]) {
	if (images.length === 0) {
		return;
	}

	await tryDeleteCloudinaryImageAssets(images);
}

function toListingCleanupImageAssetRefs(
	images: readonly ImageAssetRef[],
): CleanupImageAssetRef[] {
	return images
		.map(toCleanupImageAssetRefFromImage)
		.filter((asset): asset is CleanupImageAssetRef => asset !== null);
}

export class CloudinaryListingImageManager
	implements ListingImageManagerPort<File>
{
	constructor(
		private readonly cleanupStaging?: ListingMediaCleanupStagingPort,
	) {}

	async uploadImages(imageFiles: File[]): Promise<ImageAssetRef[]> {
		return uploadListingImages(imageFiles);
	}

	async cleanupUploadedImagesBestEffort(
		images: ImageAssetRef[],
	): Promise<void> {
		await cleanupListingImagesBestEffort(images);
	}

	async cleanupPersistedImagesBestEffort(
		images: ImageAssetRef[],
		source: ListingImageCleanupSource,
	): Promise<void> {
		if (this.cleanupStaging) {
			try {
				await stageListingMediaForCleanup(
					{
						cleanupBatchId: randomUUID(),
						listingId: source.listingId,
						sellerId: source.sellerId,
						assets: toListingCleanupImageAssetRefs(images),
					},
					this.cleanupStaging,
				);
				return;
			} catch {
				await cleanupListingImagesBestEffort(images);
				return;
			}
		}

		await cleanupListingImagesBestEffort(images);
	}
}
