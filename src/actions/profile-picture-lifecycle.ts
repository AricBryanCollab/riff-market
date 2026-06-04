import { updateProfilePicture } from "@/data/user-repo";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import {
	deleteImage,
	getPublicId,
	unsignedUploadImage,
} from "@/utils/cloudinary";
import { compressImage } from "@/utils/compress-image";

type ProfilePictureLifecycleError = {
	error: string;
	details: string;
};

type ProfilePictureUploadResult = {
	secure_url?: string;
	error?: string;
};

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

async function deleteProfilePictureAsset(profilePicUrl: string | null) {
	if (!profilePicUrl) {
		return;
	}

	const publicId = getPublicId(profilePicUrl);
	await deleteImage(publicId);
}

async function cleanupOrphanedProfilePictureAsset(
	profilePicUrl: string | null,
	logMessage: string,
) {
	try {
		await deleteProfilePictureAsset(profilePicUrl);
	} catch (error) {
		logger.error(logMessage, error);
	}
}

async function uploadProfilePicture(profilePic: File) {
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
	})) as ProfilePictureUploadResult;

	if (!uploadResult?.secure_url) {
		throw new Error(uploadResult?.error || "Cloudinary upload failed");
	}

	return uploadResult.secure_url;
}

export async function removeProfilePicture(params: {
	userId: string;
	existingProfilePicUrl: string | null;
}) {
	await updateProfilePicture(params.userId, null);
	await cleanupOrphanedProfilePictureAsset(
		params.existingProfilePicUrl,
		"Failed to clean up orphaned removed profile picture asset",
	);

	return null;
}

export async function replaceProfilePicture(params: {
	userId: string;
	profilePic: File;
	existingProfilePicUrl: string | null;
}): Promise<string | ProfilePictureLifecycleError> {
	let uploadedProfilePicUrl: string | null = null;

	try {
		uploadedProfilePicUrl = await uploadProfilePicture(params.profilePic);
		await updateProfilePicture(params.userId, uploadedProfilePicUrl);
	} catch (error) {
		await cleanupOrphanedProfilePictureAsset(
			uploadedProfilePicUrl,
			"Failed to clean up orphaned uploaded profile picture after update failure",
		);
		logger.error("Failed to update profile picture", error);
		return {
			error: "Failed to update the user profile picture",
			details: getErrorMessage(error, "Internal server error"),
		};
	}

	await cleanupOrphanedProfilePictureAsset(
		params.existingProfilePicUrl,
		"Failed to clean up orphaned replaced profile picture asset",
	);

	return uploadedProfilePicUrl;
}

export async function cleanupProfilePictureAfterAccountDeletion(
	profilePicUrl: string | null,
) {
	await cleanupOrphanedProfilePictureAsset(
		profilePicUrl,
		"Failed to clean up orphaned profile picture during account deletion",
	);
}
