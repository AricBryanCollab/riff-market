import { Prisma } from "generated/prisma/client";
import z from "zod";
import type { ImageAssetRef } from "@/types/image-asset";

const imageAssetRefSchema = z.object({
	url: z.string(),
	publicId: z.string(),
});

export function isImageAssetRef(value: unknown): value is ImageAssetRef {
	return imageAssetRefSchema.safeParse(value).success;
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

export function toImageAssetUrls(value: Prisma.JsonValue | null | undefined) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((image) =>
			isImageAssetRef(image) ? toImageAssetUrl(image) : null,
		)
		.filter((imageUrl): imageUrl is string => imageUrl !== null);
}

export function toImageAssetRefs(
	value: Prisma.JsonValue | null | undefined,
) {
	if (Array.isArray(value)) {
		return value
			.map(toImageAssetRef)
			.filter((image): image is ImageAssetRef => image !== null);
	}

	const image = toImageAssetRef(value);
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
