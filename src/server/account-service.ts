import type { PrismaClient } from "generated/prisma/client";
import {
	deleteUserAndEnqueueMediaCleanupJobs,
	getUserById,
	type UserProfileRecord,
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
import type {
	AccountDeletionResult,
	AccountProfile,
	AccountProfileUpdate,
} from "@/domains/accounts/dto/account-profile";
import type { AppError } from "@/domains/shared/domain/result";
import type { UserProfile } from "@/types/user";
import { toImageAssetUrl } from "@/utils/image-asset-ref";

type AccountServiceError = {
	readonly error: string;
	readonly details?: unknown;
};

export class UserRepoAccountProfiles
	implements
		AccountProfileReadPort,
		AccountProfileWritePort,
		AccountDeletionPort
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
