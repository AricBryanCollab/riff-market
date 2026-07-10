const BYTES_PER_MEGABYTE = 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const allowedImageMimeTypes = new Set<string>(ALLOWED_IMAGE_MIME_TYPES);

export const LISTING_IMAGE_MAX_BYTES = 10 * BYTES_PER_MEGABYTE;
export const PROFILE_IMAGE_MAX_BYTES = 4 * BYTES_PER_MEGABYTE;

export function isAllowedImageMimeType(
	mimeType: string,
): mimeType is AllowedImageMimeType {
	return allowedImageMimeTypes.has(mimeType);
}
