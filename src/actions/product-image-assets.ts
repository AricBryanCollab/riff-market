import type { Prisma } from "generated/prisma/client";
import { env } from "@/env";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import type { ImageAssetRef, ImageAssetSource } from "@/types/image-asset";
import { unsignedUploadImage } from "@/utils/cloudinary";
import {
	deleteCloudinaryImageAssets,
	tryDeleteCloudinaryImageAssets,
} from "@/utils/cloudinary-assets";
import { compressImage } from "@/utils/compress-image";
import { toImageAssetSources } from "@/utils/image-asset-ref";

const MAX_PRODUCT_IMAGE_UPLOADS = 3;
const productImageOptions = {
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

	const worker = async () => {
		while (nextIndex < items.length) {
			const index = nextIndex++;
			results[index] = await mapFn(items[index], index);
		}
	};

	await Promise.all(
		Array.from({ length: normalizedConcurrency }, () => worker()),
	);

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

async function uploadProductImage(imageFile: File): Promise<ImageAssetRef> {
	const compressedImage = await compressImage({
		file: imageFile,
		options: productImageOptions,
	});

	const uploadResult = (await unsignedUploadImage({
		buffer: compressedImage.buffer,
		filename: imageFile.name,
		uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
		folder: "products",
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

async function cleanupUploadedProductImages(images: ImageAssetRef[]) {
	if (images.length === 0) {
		return;
	}

	await tryDeleteCloudinaryImageAssets(images);
}

export async function uploadProductImages(
	imageFiles: File[],
): Promise<ImageAssetRef[]> {
	const uploadedImages: ImageAssetRef[] = [];

	try {
		const images = await mapWithConcurrency(
			imageFiles,
			MAX_PRODUCT_IMAGE_UPLOADS,
			async (imageFile) => {
				const image = await uploadProductImage(imageFile);
				uploadedImages.push(image);
				return image;
			},
		);

		return images;
	} catch (error) {
		await cleanupUploadedProductImages(uploadedImages);
		throw error;
	}
}

export async function deleteProductImages(images: ImageAssetSource[]) {
	await deleteCloudinaryImageAssets(images);
}

export async function deleteProductImagesFromValue(
	imagesValue: Prisma.JsonValue | null | undefined,
) {
	await deleteProductImages(toImageAssetSources(imagesValue));
}
