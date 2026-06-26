import { Prisma } from "generated/prisma/client";
import z from "zod";
import type { CleanupImageAssetRef, ImageAssetRef } from "@/types/image-asset";

const LEGACY_IMAGE_ASSET_PROVIDER = "cloudinary";
const LEGACY_IMAGE_ASSET_TYPE = "image";
const SUPPORTED_CLEANUP_IMAGE_ASSET_PROVIDERS = new Set([
	LEGACY_IMAGE_ASSET_PROVIDER,
]);

const imageAssetRefSchema = z.object({
	url: z.string(),
	publicId: z.string(),
});

const cleanupImageAssetRefSchema = z.object({
	url: z.string(),
	provider: z.string(),
	assetType: z.string(),
	providerAssetId: z.string(),
});

export function isImageAssetRef(value: unknown): value is ImageAssetRef {
	return imageAssetRefSchema.safeParse(value).success;
}

export function isCleanupImageAssetRef(
	value: unknown,
): value is CleanupImageAssetRef {
	return cleanupImageAssetRefSchema.safeParse(value).success;
}

export function toImageAssetUrl(value: Prisma.JsonValue | null | undefined) {
	if (isImageAssetRef(value)) {
		return value.url;
	}

	return null;
}

export function toImageAssetRef(
	value: Prisma.JsonValue | null | undefined,
): ImageAssetRef | null {
	if (isImageAssetRef(value)) {
		return {
			url: value.url,
			publicId: value.publicId,
		};
	}

	return null;
}

export function toCleanupImageAssetRefFromImage(
	image: ImageAssetRef,
): CleanupImageAssetRef | null {
	const providerAssetId = image.publicId.trim();

	if (providerAssetId.length === 0) {
		return null;
	}

	return {
		url: image.url,
		provider: LEGACY_IMAGE_ASSET_PROVIDER,
		assetType: LEGACY_IMAGE_ASSET_TYPE,
		providerAssetId,
	};
}

export function toCleanupImageAssetRef(
	value: Prisma.JsonValue | null | undefined,
): CleanupImageAssetRef | null {
	if (isCleanupImageAssetRef(value)) {
		const provider = value.provider.trim().toLowerCase();
		const assetType = value.assetType.trim().toLowerCase();
		const providerAssetId = value.providerAssetId.trim();

		if (
			!SUPPORTED_CLEANUP_IMAGE_ASSET_PROVIDERS.has(provider) ||
			assetType !== LEGACY_IMAGE_ASSET_TYPE ||
			providerAssetId.length === 0
		) {
			return null;
		}

		return {
			url: value.url,
			provider,
			assetType,
			providerAssetId,
		};
	}

	const image = toImageAssetRef(value);
	if (!image) {
		return null;
	}

	return toCleanupImageAssetRefFromImage(image);
}

export function toImageAssetUrls(value: Prisma.JsonValue | null | undefined) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((image) => (isImageAssetRef(image) ? toImageAssetUrl(image) : null))
		.filter((imageUrl): imageUrl is string => imageUrl !== null);
}

export function toImageAssetRefs(value: Prisma.JsonValue | null | undefined) {
	if (Array.isArray(value)) {
		return value
			.map(toImageAssetRef)
			.filter((image): image is ImageAssetRef => image !== null);
	}

	const image = toImageAssetRef(value);
	return image ? [image] : [];
}

export function toCleanupImageAssetRefs(
	value: Prisma.JsonValue | null | undefined,
) {
	if (Array.isArray(value)) {
		return value
			.map(toCleanupImageAssetRef)
			.filter((image): image is CleanupImageAssetRef => image !== null);
	}

	const image = toCleanupImageAssetRef(value);
	return image ? [image] : [];
}

export function toNullableJsonImageAssetRef(
	image: ImageAssetRef | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
	return image
		? {
				url: image.url,
				publicId: image.publicId,
			}
		: Prisma.JsonNull;
}
