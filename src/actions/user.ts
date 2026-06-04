import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
	deleteUser,
	getAllUsers,
	getUserById,
	updateProfilePicture,
	updateUser,
} from "@/data/user-repo";
import { env } from "@/env";
import { logger } from "@/lib/logger";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";
import {
	deleteImage,
	getPublicId,
	unsignedUploadImage,
} from "@/utils/cloudinary";
import { compressImage } from "@/utils/compress-image";

async function deleteProfilePictureAsset(profilePicUrl: string | null) {
	if (!profilePicUrl) {
		return;
	}

	const publicId = getPublicId(profilePicUrl);
	await deleteImage(publicId);
}

async function cleanupProfilePictureAsset(
	profilePicUrl: string | null,
	logMessage: string,
) {
	try {
		await deleteProfilePictureAsset(profilePicUrl);
	} catch (error) {
		logger.error(logMessage, error);
	}
}

export async function getUserByIdService(userId: string) {
	const user = await getUserById(userId);
	if (!user) {
		return {
			error: "User not found",
		};
	}

	return { data: user };
}

export const getAllUsersService = createServerFn({
	method: "GET",
}).handler(async () => {
	const users = await getAllUsers();
	return users;
});

export async function updateUserService(
	userId: string,
	rawData: UpdateUserInput,
) {
	const parsed = updateUserSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid user data to update",
			details: z.flattenError(parsed.error),
		};
	}

	const updatedUser = await updateValidatedUserService(userId, parsed.data);

	return updatedUser;
}

export async function updateValidatedUserService(
	userId: string,
	data: UpdateUserInput,
) {
	const existingUser = await getUserById(userId);

	if (!existingUser) {
		return {
			error: "User not found",
		};
	}

	const updatedUser = await updateUser(userId, data);

	return updatedUser;
}

export async function updateUserProfilePicService(
	userId: string,
	profilePic: File | null,
) {
	if (profilePic !== null) {
		const parsed = updateProfilePictureSchema.safeParse({
			profilePic: profilePic,
		});

		if (!parsed.success) {
			return {
				error: "Invalid profile picture",
				details: z.flattenError(parsed.error),
			};
		}
	}

	return updateValidatedUserProfilePicService(userId, profilePic);
}

export async function updateValidatedUserProfilePicService(
	userId: string,
	profilePic: File | null,
) {
	const existingUser = await getUserById(userId);

	if (!existingUser) {
		return {
			error: "User not found",
		};
	}

	if (profilePic === null) {
		await updateProfilePicture(userId, null);
		await cleanupProfilePictureAsset(
			existingUser.profilePic,
			"Failed to delete removed profile picture asset",
		);

		return profilePic;
	}

	let profPicUrl: string | null = null;

	try {
		const compressedImage = await compressImage({
			file: profilePic,
			options: {
				maxSize: 800,
				quality: 85,
				format: "jpeg",
			},
		});

		const uploadResult = await unsignedUploadImage({
			buffer: compressedImage.buffer,
			filename: profilePic.name,
			uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
		});

		profPicUrl = uploadResult.secure_url;
		await updateProfilePicture(userId, profPicUrl);
	} catch (error) {
		await cleanupProfilePictureAsset(
			profPicUrl,
			"Failed to delete uploaded profile picture after update failure",
		);
		logger.error("Failed to update profile picture", error);
		return {
			error: "Failed to update the user profile picture",
			details: error instanceof Error ? error.message : "Internal server error",
		};
	}

	await cleanupProfilePictureAsset(
		existingUser.profilePic,
		"Failed to delete replaced profile picture asset",
	);

	return profPicUrl;
}

export async function deleteUserService(userId: string, email: string) {
	const existingUser = await getUserById(userId);

	if (!existingUser) {
		return {
			error: "User not found",
		};
	}

	if (existingUser?.email !== email) {
		return {
			error: "Email verification failed for account deletion",
		};
	}

	await deleteUser(userId);
	await cleanupProfilePictureAsset(
		existingUser.profilePic,
		"Failed to delete profile picture during account deletion",
	);

	return {
		message: "Account has been deleted successfully",
		deletedUserId: userId,
	};
}
