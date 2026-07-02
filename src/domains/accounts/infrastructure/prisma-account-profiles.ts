import { randomUUID } from "node:crypto";
import type {
	Prisma,
	PrismaClient,
	User,
	UserSettings,
} from "generated/prisma/client";
import type {
	AccountDeletionPort,
	AccountProfileReadPort,
	AccountProfileWritePort,
} from "@/domains/accounts/application/account-profile";
import type {
	AccountProfilePictureReadPort,
	AccountProfilePictureWritePort,
} from "@/domains/accounts/application/account-profile-picture";
import type {
	AccountProfile,
	AccountProfileUpdate,
} from "@/domains/accounts/dto/account-profile";
import type { AccountProfilePictureAsset } from "@/domains/accounts/dto/account-profile-picture";
import { stageAccountMediaForCleanup } from "@/domains/media/application/stage-account-media-cleanup";
import { PrismaAccountMediaCleanupStaging } from "@/domains/media/infrastructure/prisma-account-media-cleanup-staging";
import {
	toImageAssetRef,
	toImageAssetUrl,
	toNullableJsonImageAssetRef,
} from "@/utils/image-asset-ref";

type DbClient = PrismaClient | Prisma.TransactionClient;

type UserProfileRecord = {
	readonly id: string;
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
	readonly role: User["role"];
	readonly theme: string;
	readonly phone: string | null;
	readonly profilePic: Prisma.JsonValue | null;
	readonly address: string | null;
};

type UserSettingsWriteData = Partial<
	Pick<UserSettings, "address" | "phone" | "theme">
>;

export class PrismaAccountProfiles
	implements
		AccountProfileReadPort,
		AccountProfileWritePort,
		AccountDeletionPort,
		AccountProfilePictureReadPort,
		AccountProfilePictureWritePort
{
	constructor(private readonly db: PrismaClient) {}

	async findById(userId: string): Promise<AccountProfile | null> {
		const user = await findAccountProfileRecordById(this.db, userId);

		return user ? toAccountProfile(user) : null;
	}

	async updateProfile(
		userId: string,
		data: AccountProfileUpdate,
	): Promise<AccountProfile> {
		const updated = await this.db.$transaction(async (transaction) => {
			if (data.firstName || data.lastName) {
				await transaction.user.update({
					where: { id: userId },
					data: {
						firstName: data.firstName,
						lastName: data.lastName,
					},
				});
			}

			if (
				data.phone !== undefined ||
				data.address !== undefined ||
				data.theme !== undefined
			) {
				const settingsData = getProvidedUserSettingsData(data);

				await transaction.userSettings.upsert({
					where: { userId },
					update: settingsData,
					create: {
						userId,
						theme: "light",
						...settingsData,
					},
				});
			}

			const account = await findAccountProfileRecordById(transaction, userId);
			if (!account) {
				throw new Error(`Account profile ${userId} was not found after update`);
			}

			return account;
		});

		return toAccountProfile(updated);
	}

	async deleteAccount(userId: string): Promise<void> {
		await this.db.$transaction(async (transaction) => {
			await stageAccountMediaForCleanup(
				{
					accountId: userId,
					cleanupBatchId: randomUUID(),
				},
				new PrismaAccountMediaCleanupStaging(transaction),
			);
			await transaction.user.delete({
				where: { id: userId },
			});
		});
	}

	async findProfilePictureStateByUserId(userId: string) {
		const user = await findAccountProfileRecordById(this.db, userId);

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
		await this.db.userSettings.upsert({
			where: { userId },
			update: { profilePic: toNullableJsonImageAssetRef(profilePic) },
			create: {
				userId,
				profilePic: toNullableJsonImageAssetRef(profilePic),
				theme: "light",
			},
		});
	}
}

async function findAccountProfileRecordById(
	db: DbClient,
	userId: string,
): Promise<UserProfileRecord | null> {
	const [user] = await getAccountProfileRecords(db, { id: userId });
	return user ?? null;
}

async function getAccountProfileRecords(
	db: DbClient,
	where?: Prisma.UserWhereInput,
): Promise<UserProfileRecord[]> {
	const users = await db.user.findMany({ where });

	if (users.length === 0) {
		return [];
	}

	const userIds = users.map((user) => user.id);
	const settings = await db.userSettings.findMany({
		where: {
			userId: { in: userIds },
		},
	});
	const settingsByUserId = new Map(
		settings.map((userSettings) => [userSettings.userId, userSettings]),
	);

	return users.map((user) => {
		const userSettings = settingsByUserId.get(user.id);

		return {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			role: user.role,
			theme: userSettings?.theme ?? "light",
			phone: userSettings?.phone ?? null,
			profilePic: userSettings?.profilePic ?? null,
			address: userSettings?.address ?? null,
		};
	});
}

function getProvidedUserSettingsData(
	data: AccountProfileUpdate,
): UserSettingsWriteData {
	return {
		...(data.phone !== undefined ? { phone: data.phone } : {}),
		...(data.address !== undefined ? { address: data.address } : {}),
		...(data.theme !== undefined ? { theme: data.theme } : {}),
	};
}

function toAccountProfile(user: UserProfileRecord): AccountProfile {
	return {
		...user,
		profilePic: toImageAssetUrl(user.profilePic),
	};
}
