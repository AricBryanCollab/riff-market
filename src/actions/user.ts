import { createServerFn } from "@tanstack/react-start";
import {
	deleteUser,
	getAllUsers,
	getUserById,
	updateProfilePicture,
	updateUser,
} from "@/data/user.repo";
import { env } from "@/env";
import {
	type UpdateUserInput,
	udpateUserSchema,
	updateProfilePictureSchema,
} from "@/lib/zod/user.validation";
import {
	deleteImage,
	getPublicId,
	unsignedUploadImage,
} from "@/utils/cloudinary";
import { compressImage } from "@/utils/compressimage";
import { useAppSession } from "@/utils/session";

export async function getUserByIdService() {
	const session = await useAppSession();
	const userId = session.data.userId;

	if (!session || !userId) {
		return null;
	}

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
	const parsed = udpateUserSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid user data to update",
			details: parsed.error,
		};
	}

	const existingUser = await getUserById(userId);

	if (!existingUser) {
		return {
			error: "User not found",
		};
	}

	const data = parsed.data;

	const updatedUser = await updateUser(userId, data);

	return updatedUser;
}

export async function updateUserProfilePicService(
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
		if (existingUser?.profilePic) {
			const publicId = getPublicId(existingUser?.profilePic);
			await deleteImage(publicId);
		}
		await updateProfilePicture(userId, null);

		return profilePic;
	}

	const parsed = updateProfilePictureSchema.safeParse({
		profilePic: profilePic,
	});

	if (!parsed.success) {
		return {
			error: "Invalid profile picture",
			details: parsed.error,
		};
	}

	let profPicUrl: string;

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

		if (existingUser?.profilePic) {
			const publicId = getPublicId(existingUser?.profilePic);
			await deleteImage(publicId);
		}
	} catch (error) {
		console.error("Error at updateProfilePictureService", error);
		return {
			error: "Failed to update the user profile picture",
			details: error instanceof Error ? error.message : "Internal server error",
		};
	}

	await updateProfilePicture(userId, profPicUrl);

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

	return;
}
