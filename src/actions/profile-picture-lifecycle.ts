import type { Prisma } from "generated/prisma/client";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import type { CloudinaryUploadResult } from "@/types/cloudinary";
import type { ImageAssetRef, ImageAssetSource } from "@/types/image-asset";
import { unsignedUploadImage } from "@/utils/cloudinary";
import { deleteCloudinaryImageAsset } from "@/utils/cloudinary-assets";
import { compressImage } from "@/utils/compress-image";
import { toImageAssetSource } from "@/utils/image-asset-ref";

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

async function deleteProfilePictureAsset(profilePic: ImageAssetSource | null) {
	if (!profilePic) {
		return;
	}

	await deleteCloudinaryImageAsset(profilePic);
}

export async function cleanupOrphanedProfilePictureAsset(
	profilePic: ImageAssetSource | null,
	logMessage: string,
) {
	try {
		await deleteProfilePictureAsset(profilePic);
	} catch (error) {
		logger.error(logMessage, error);
	}
}

export async function cleanupOrphanedProfilePictureAssetFromValue(
	profilePicValue: Prisma.JsonValue | null | undefined,
	logMessage: string,
) {
	await cleanupOrphanedProfilePictureAsset(
		toImageAssetSource(profilePicValue),
		logMessage,
	);
}

export async function uploadProfilePicture(
	profilePic: File,
): Promise<ImageAssetRef> {
	const compressedImage = await compressImage({
		file: profilePic,
		options: {
			maxSize: 800,
			quality: 85,
			format: "jpeg",
		},
	});

	const uploadResult = (await unsignedUploadImage({
		buffer: compressedImage.buffer,
		filename: profilePic.name,
		uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
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

export async function cleanupProfilePictureAfterAccountDeletion(
	profilePicValue: Prisma.JsonValue | null | undefined,
) {
	await cleanupOrphanedProfilePictureAssetFromValue(
		profilePicValue,
		"Failed to clean up orphaned profile picture during account deletion",
	);
}
