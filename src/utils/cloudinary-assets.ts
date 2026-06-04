import type { CloudinaryImageSource } from "@/types/cloudinary";
import { deleteImage } from "@/utils/cloudinary";

const CLOUDINARY_UPLOAD_PATH = "/image/upload/";
const CLOUDINARY_VERSION_SEGMENT = /^v\d+$/;
const CLOUDINARY_TRANSFORMATION_TOKEN =
	/^(?:a|ar|b|bo|c|co|d|dl|dn|dpr|e|f|fl|fn|g|h|if|l|o|pg|q|r|t|u|w|x|y|z)_.+$/;

function getImagePath(imageUrl: string) {
	try {
		return new URL(imageUrl).pathname;
	} catch {
		return imageUrl;
	}
}

function removeFileExtension(path: string) {
	return path.replace(/\.[^/.]+$/, "");
}

function getFallbackAssetPath(imagePath: string) {
	return imagePath.split("/").filter(Boolean).at(-1) || "";
}

function getAssetPath(imagePath: string) {
	const uploadPathIndex = imagePath.indexOf(CLOUDINARY_UPLOAD_PATH);

	if (uploadPathIndex < 0) {
		return getFallbackAssetPath(imagePath);
	}

	return imagePath.slice(uploadPathIndex + CLOUDINARY_UPLOAD_PATH.length);
}

function isCloudinaryTransformationSegment(segment: string) {
	return segment
		.split(",")
		.every((token) => CLOUDINARY_TRANSFORMATION_TOKEN.test(token));
}

function getSegmentsAfterVersion(segments: string[]) {
	const versionSegmentIndex = segments.findIndex((segment) =>
		CLOUDINARY_VERSION_SEGMENT.test(segment),
	);

	if (versionSegmentIndex < 0) {
		return null;
	}

	return segments.slice(versionSegmentIndex + 1);
}

function removeLeadingTransformationSegments(segments: string[]) {
	const firstAssetSegmentIndex = segments.findIndex(
		(segment) => !isCloudinaryTransformationSegment(segment),
	);

	return firstAssetSegmentIndex >= 0
		? segments.slice(firstAssetSegmentIndex)
		: [];
}

function getPublicIdSegments(assetPath: string) {
	const segments = assetPath.split("/").filter(Boolean);
	const segmentsAfterVersion = getSegmentsAfterVersion(segments);

	if (segmentsAfterVersion) {
		return segmentsAfterVersion;
	}

	return removeLeadingTransformationSegments(segments);
}

function getCloudinaryImagePublicIdFromUrl(imageUrl: string) {
	const assetPath = getAssetPath(getImagePath(imageUrl));
	const publicIdPath = getPublicIdSegments(assetPath).join("/");

	return decodeURIComponent(removeFileExtension(publicIdPath));
}

function getCloudinaryImagePublicId(image: CloudinaryImageSource) {
	return typeof image === "string"
		? getCloudinaryImagePublicIdFromUrl(image)
		: image.publicId;
}

export async function deleteCloudinaryImageAsset(image: CloudinaryImageSource) {
	const publicId = getCloudinaryImagePublicId(image);
	return deleteImage(publicId);
}

export async function deleteCloudinaryImageAssets(
	images: CloudinaryImageSource[],
) {
	return Promise.all(images.map(deleteCloudinaryImageAsset));
}

export async function tryDeleteCloudinaryImageAssets(
	images: CloudinaryImageSource[],
) {
	return Promise.allSettled(images.map(deleteCloudinaryImageAsset));
}
