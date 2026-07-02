import {
	type AccountDeletionPort,
	type AccountProfileReadPort,
	type AccountProfileWritePort,
	deleteAccount as deleteAccountUseCase,
	getAccountProfile as getAccountProfileUseCase,
	updateAccountProfile as updateAccountProfileUseCase,
} from "@/domains/accounts/application/account-profile";
import {
	type AccountProfilePictureCleanupPort,
	type AccountProfilePictureReadPort,
	type AccountProfilePictureUploadPort,
	type AccountProfilePictureWritePort,
	updateAccountProfilePicture as updateAccountProfilePictureUseCase,
} from "@/domains/accounts/application/account-profile-picture";
import type {
	AccountDeletionResult,
	AccountProfile,
	AccountProfileUpdate,
} from "@/domains/accounts/dto/account-profile";
import type { AccountProfilePictureUpdateResult } from "@/domains/accounts/dto/account-profile-picture";
import { PrismaAccountProfiles } from "@/domains/accounts/infrastructure/prisma-account-profiles";
import type { AppError } from "@/domains/shared/domain/result";
import { logger } from "@/lib/logger";
import type { UserProfile } from "@/types/user";

export type AccountServiceError = AppError & {
	readonly error: string;
};

export async function getAccountProfile(
	userId: string,
	accounts?: AccountProfileReadPort,
): Promise<{ readonly data: UserProfile } | AccountServiceError> {
	const result = await getAccountProfileUseCase(
		userId,
		accounts ?? (await createPrismaAccountProfiles()),
	);

	if (!result.ok) {
		return toAccountServiceError(result.error);
	}

	return { data: toUserProfile(result.value) };
}

export async function updateAccountProfile(
	userId: string,
	data: AccountProfileUpdate,
	accounts?: AccountProfileReadPort & AccountProfileWritePort,
): Promise<UserProfile | AccountServiceError> {
	const result = await updateAccountProfileUseCase(
		{
			userId,
			data,
		},
		accounts ?? (await createPrismaAccountProfiles()),
	);

	if (!result.ok) {
		return toAccountServiceError(result.error);
	}

	return toUserProfile(result.value);
}

export async function deleteAccount(
	userId: string,
	email: string,
	accounts?: AccountProfileReadPort & AccountDeletionPort,
): Promise<AccountDeletionResult | AccountServiceError> {
	const result = await deleteAccountUseCase(
		{ userId, email },
		accounts ?? (await createPrismaAccountProfiles()),
	);

	if (!result.ok) {
		return toAccountServiceError(result.error);
	}

	return result.value;
}

export async function updateAccountProfilePicture(
	userId: string,
	profilePic: File | null,
	accounts?: AccountProfilePictureReadPort & AccountProfilePictureWritePort,
	imageAssets?: AccountProfilePictureUploadPort<File> &
		AccountProfilePictureCleanupPort,
): Promise<AccountProfilePictureUpdateResult | AccountServiceError> {
	const result = await updateAccountProfilePictureUseCase(
		profilePic === null
			? { userId, kind: "remove" }
			: { userId, kind: "replace", profilePic },
		accounts ?? (await createPrismaAccountProfiles()),
		imageAssets ?? (await createCloudinaryProfilePictureAssets()),
		logger,
	);

	if (!result.ok) {
		return toAccountServiceError(result.error);
	}

	return result.value;
}

function toUserProfile(account: AccountProfile): UserProfile {
	return { ...account };
}

function toAccountServiceError(error: AppError): AccountServiceError {
	return {
		...error,
		error: error.message,
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
