import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
	deleteUserAndEnqueueMediaCleanupJobs,
	getAllUsers,
	getUserById,
	getUserProfilePictureValueById,
	type UserProfileRecord,
	updateProfilePicture,
	updateUser,
} from "@/data/user-repo";
import { logger } from "@/lib/logger";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";
import type { ImageAssetRef } from "@/types/image-asset";
import type { UserProfile } from "@/types/user";
import {
	toImageAssetUrl,
	toNullableJsonImageAssetRef,
} from "@/utils/image-asset-ref";
import {
	cleanupOrphanedProfilePictureAsset,
	cleanupOrphanedProfilePictureAssetFromValue,
	uploadProfilePicture,
} from "./profile-picture-lifecycle";

type ProfilePictureUpdateError = {
	error: string;
	details: string;
};

function getErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error ? error.message : fallback;
}

function toUserProfile(user: UserProfileRecord): UserProfile {
	return {
		...user,
		profilePic: toImageAssetUrl(user.profilePic),
	};
}

export async function getUserByIdService(userId: string) {
	const user = await getUserById(userId);
	if (!user) {
		return {
			error: "User not found",
		};
	}

	return { data: toUserProfile(user) };
}

export const getAllUsersService = createServerFn({
	method: "GET",
}).handler(async () => {
	const users = await getAllUsers();
	return users.map(toUserProfile);
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

	return toUserProfile(updatedUser);
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

	const existingProfilePicValue = await getUserProfilePictureValueById(userId);

	if (profilePic === null) {
		await updateProfilePicture(userId, toNullableJsonImageAssetRef(null));
		await cleanupOrphanedProfilePictureAssetFromValue(
			existingProfilePicValue,
			"Failed to clean up orphaned removed profile picture asset",
		);

		return null;
	}

	let uploadedProfilePic: ImageAssetRef | null = null;

	try {
		uploadedProfilePic = await uploadProfilePicture(profilePic);
		await updateProfilePicture(
			userId,
			toNullableJsonImageAssetRef(uploadedProfilePic),
		);
	} catch (error) {
		await cleanupOrphanedProfilePictureAsset(
			uploadedProfilePic,
			"Failed to clean up orphaned uploaded profile picture after update failure",
		);
		logger.error("Failed to update profile picture", error);
		return {
			error: "Failed to update the user profile picture",
			details: getErrorMessage(error, "Internal server error"),
		} satisfies ProfilePictureUpdateError;
	}

	await cleanupOrphanedProfilePictureAssetFromValue(
		existingProfilePicValue,
		"Failed to clean up orphaned replaced profile picture asset",
	);

	return uploadedProfilePic.url;
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

	await deleteUserAndEnqueueMediaCleanupJobs(userId);

	return {
		message: "Account has been deleted successfully",
		deletedUserId: userId,
	};
}
