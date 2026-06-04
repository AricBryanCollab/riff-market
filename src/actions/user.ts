import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import {
	deleteUser,
	getAllUsers,
	getUserById,
	updateUser,
} from "@/data/user-repo";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";
import {
	cleanupProfilePictureAfterAccountDeletion,
	removeProfilePicture,
	replaceProfilePicture,
} from "./profile-picture-lifecycle";

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
		return removeProfilePicture({
			userId,
			existingProfilePicUrl: existingUser.profilePic,
		});
	}

	return replaceProfilePicture({
		userId,
		profilePic,
		existingProfilePicUrl: existingUser.profilePic,
	});
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
	await cleanupProfilePictureAfterAccountDeletion(existingUser.profilePic);

	return {
		message: "Account has been deleted successfully",
		deletedUserId: userId,
	};
}
