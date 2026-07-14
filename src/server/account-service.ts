import z from "zod";
import {
	type AccountDeletionPort,
	type AccountProfileReadPort,
	type AccountProfileWritePort,
	deleteAccount,
	updateAccountProfile,
} from "@/domains/accounts/application/account-profile";
import {
	type AccountProfilePictureCleanupPort,
	type AccountProfilePictureReadPort,
	type AccountProfilePictureUploadPort,
	type AccountProfilePictureWritePort,
	updateAccountProfilePicture,
} from "@/domains/accounts/application/account-profile-picture";
import { PrismaAccountProfiles } from "@/domains/accounts/infrastructure/prisma-account-profiles";
import { logger } from "@/lib/logger";
import {
	type UpdateUserInput,
	updateProfilePictureSchema,
	updateUserSchema,
} from "@/lib/zod/user-validation";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";
import type { UserProfile } from "@/types/user";

const deleteCurrentUserSchema = z.object({
	email: z.email("Enter the email address on your account"),
});

export type DeleteCurrentUserInput = z.infer<typeof deleteCurrentUserSchema>;

export function validateCurrentUserUpdateInput(data: unknown): UpdateUserInput {
	const parsed = updateUserSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid user data to update", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateDeleteCurrentUserInput(
	data: unknown,
): DeleteCurrentUserInput {
	const parsed = deleteCurrentUserSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid account deletion request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export function validateProfilePictureFormData(data: FormData) {
	if (!(data instanceof FormData)) {
		throw new RequestError("Expected profile picture form data");
	}

	const profilePic = data.get("profilePic");
	const parsed = updateProfilePictureSchema.safeParse({ profilePic });

	if (!parsed.success) {
		throw new RequestError("Invalid profile picture", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function getCurrentUser(
	userId: string,
	accounts?: AccountProfileReadPort,
): Promise<UserProfile> {
	const accountProfiles = accounts ?? (await createPrismaAccountProfiles());
	const account = await accountProfiles.findById(userId);

	if (!account) {
		throw new RequestError("User not found", {
			code: "ACCOUNT_PROFILE_NOT_FOUND",
			status: 404,
		});
	}

	return account;
}

export async function getOptionalCurrentUser(
	userId: string | null | undefined,
	accounts?: AccountProfileReadPort,
): Promise<UserProfile | null> {
	if (!userId) {
		return null;
	}

	const accountProfiles = accounts ?? (await createPrismaAccountProfiles());
	const account = await accountProfiles.findById(userId);

	if (!account) {
		return null;
	}

	return account;
}

export async function updateCurrentUser(
	userId: string,
	data: UpdateUserInput,
	accounts?: AccountProfileReadPort & AccountProfileWritePort,
): Promise<UserProfile> {
	const result = await updateAccountProfile(
		{ userId, data },
		accounts ?? (await createPrismaAccountProfiles()),
	);

	return unwrapResultOrThrowRequestError(result);
}

export async function deleteCurrentUser(
	userId: string,
	email: string,
	accounts?: AccountProfileReadPort & AccountDeletionPort,
) {
	const result = await deleteAccount(
		{ userId, email },
		accounts ?? (await createPrismaAccountProfiles()),
	);

	return unwrapResultOrThrowRequestError(result);
}

export async function updateCurrentUserProfilePicture(
	userId: string,
	profilePic: File | null,
	accounts?: AccountProfilePictureReadPort & AccountProfilePictureWritePort,
	imageAssets?: AccountProfilePictureUploadPort<File> &
		AccountProfilePictureCleanupPort,
): Promise<string | null> {
	const result = await updateAccountProfilePicture(
		profilePic === null
			? { userId, kind: "remove" }
			: { userId, kind: "replace", profilePic },
		accounts ?? (await createPrismaAccountProfiles()),
		imageAssets ?? (await createCloudinaryProfilePictureAssets()),
		logger,
	);

	return unwrapResultOrThrowRequestError(result).profilePic;
}

export function toProfilePictureResponse(profilePic: string | null) {
	return {
		message: "Profile picture has been updated successfully",
		profilePic,
	};
}

async function createPrismaAccountProfiles() {
	const { prisma } = await import("@/data/connect-db");
	return new PrismaAccountProfiles(prisma);
}

async function createCloudinaryProfilePictureAssets() {
	const {
		deleteCloudinaryProfilePictureAsset,
		uploadCloudinaryProfilePicture,
	} = await import("@/domains/accounts/infrastructure/profile-picture-assets");

	return {
		uploadProfilePicture: uploadCloudinaryProfilePicture,
		deleteProfilePictureAsset: deleteCloudinaryProfilePictureAsset,
	};
}
