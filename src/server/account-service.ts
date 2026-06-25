import type { PrismaClient } from "generated/prisma/client";
import {
	deleteUserAndEnqueueMediaCleanupJobs,
	getUserById,
	type UserProfileRecord,
	updateProfilePicture,
	updateUser,
} from "@/data/user-repo";
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
import type {
	AccountProfilePictureAsset,
	AccountProfilePictureUpdateResult,
} from "@/domains/accounts/dto/account-profile-picture";
import type { AppError } from "@/domains/shared/domain/result";
import { logger } from "@/lib/logger";
import type { UserProfile } from "@/types/user";
import {
	toImageAssetRef,
	toImageAssetUrl,
	toNullableJsonImageAssetRef,
} from "@/utils/image-asset-ref";

type AccountServiceError = {
	readonly error: string;
	readonly details?: unknown;
};

export class UserRepoAccountProfiles
	implements
		AccountProfileReadPort,
		AccountProfileWritePort,
		AccountDeletionPort,
		AccountProfilePictureReadPort,
		AccountProfilePictureWritePort
{
	constructor(private readonly db: PrismaClient) {}

	async findById(userId: string): Promise<AccountProfile | null> {
		const user = await getUserById(userId, this.db);

		return user ? toAccountProfile(user) : null;
	}

	async updateProfile(
		userId: string,
		data: AccountProfileUpdate,
	): Promise<AccountProfile> {
		return toAccountProfile(await updateUser(userId, data, this.db));
	}

	async deleteAccountAndEnqueueMediaCleanup(userId: string): Promise<void> {
		await deleteUserAndEnqueueMediaCleanupJobs(userId, this.db);
	}

	async findProfilePictureStateByUserId(userId: string) {
		const user = await getUserById(userId, this.db);

		if (!user) {
			return null;
		}

		return {
			profilePic: toImageAssetRef(user.profilePic),
		};
	}

	async updateProfilePicture(
		userId: string,
		profilePic: AccountProfilePictureAsset | null,
	): Promise<void> {
		await updateProfilePicture(
			userId,
			toNullableJsonImageAssetRef(profilePic),
			this.db,
		);
	}
}

export async function getAccountProfile(
	userId: string,
	accounts?: AccountProfileReadPort,
): Promise<{ readonly data: UserProfile } | AccountServiceError> {
	const result = await getAccountProfileUseCase(
		userId,
		accounts ?? (await createUserRepoAccountProfiles()),
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
		accounts ?? (await createUserRepoAccountProfiles()),
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
		accounts ?? (await createUserRepoAccountProfiles()),
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
		accounts ?? (await createUserRepoAccountProfiles()),
		imageAssets ?? (await createCloudinaryProfilePictureAssets()),
		logger,
	);

	if (!result.ok) {
		return toAccountServiceError(result.error);
	}

	return result.value;
}

function toAccountProfile(user: UserProfileRecord): AccountProfile {
	return {
		...user,
		profilePic: toImageAssetUrl(user.profilePic),
	};
}

function toUserProfile(account: AccountProfile): UserProfile {
	return { ...account };
}

function toAccountServiceError(error: AppError): AccountServiceError {
	return {
		error: error.message,
		...(error.details === undefined ? {} : { details: error.details }),
	};
}

async function createUserRepoAccountProfiles() {
	const { prisma } = await import("@/data/connect-db");
	return new UserRepoAccountProfiles(prisma);
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
