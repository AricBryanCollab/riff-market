import { Prisma } from "generated/prisma/client";
import z from "zod";
import type { ImageAssetRef, ImageAssetSource } from "@/types/image-asset";

const imageAssetRefSchema = z.object({
	url: z.string(),
	publicId: z.string(),
});

export function isImageAssetRef(value: unknown): value is ImageAssetRef {
	return imageAssetRefSchema.safeParse(value).success;
}

export function toImageAssetUrl(value: Prisma.JsonValue | null | undefined) {
	if (typeof value === "string") {
		return value;
	}

	if (isImageAssetRef(value)) {
		return value.url;
	}

	return null;
}

export function toImageAssetSource(
	value: Prisma.JsonValue | null | undefined,
): ImageAssetSource | null {
	if (typeof value === "string") {
		return value;
	}

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
			typeof image === "string" || isImageAssetRef(image)
				? toImageAssetUrl(image)
				: null,
		)
		.filter((imageUrl): imageUrl is string => imageUrl !== null);
}

export function toImageAssetSources(
	value: Prisma.JsonValue | null | undefined,
) {
	if (Array.isArray(value)) {
		return value
			.map(toImageAssetSource)
			.filter((image): image is ImageAssetSource => image !== null);
	}

	const image = toImageAssetSource(value);
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
