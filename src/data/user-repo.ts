import { randomUUID } from "node:crypto";
import type {
	Prisma,
	PrismaClient,
	User,
	UserSettings,
} from "generated/prisma/client";
import { prisma } from "@/data/connect-db";
import { logger } from "@/lib/logger";
import type { UpdateUserInput } from "@/lib/zod/user-validation";
import { getAccountMediaCleanupJobInputs } from "./media-cleanup-job-data";

type DbClient = PrismaClient | Prisma.TransactionClient;
export type UserProfileRecord = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: User["role"];
	theme: string;
	phone: string | null;
	profilePic: Prisma.JsonValue | null;
	address: string | null;
};
type UserSettingsWriteData = Partial<
	Pick<UserSettings, "address" | "phone" | "theme">
>;

const getProvidedUserSettingsData = (
	data: UpdateUserInput,
): UserSettingsWriteData => ({
	...(data.phone !== undefined ? { phone: data.phone } : {}),
	...(data.address !== undefined ? { address: data.address } : {}),
	...(data.theme !== undefined ? { theme: data.theme } : {}),
});

const getUserProfiles = async (
	db: DbClient,
	where?: Prisma.UserWhereInput,
): Promise<UserProfileRecord[]> => {
	const users = await db.user.findMany({
		where,
	});

	if (users.length === 0) return [];

	const userIds = users.map((u) => u.id);

	const settings = await db.userSettings.findMany({
		where: {
			userId: { in: userIds },
		},
	});

	const settingsMap = new Map<string, UserSettings>(
		settings.map((s) => [s.userId, s]),
	);

	return users.map((user: User) => {
		const userSettings = settingsMap.get(user.id);

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
};

export const getUserById = async (
	id: string,
): Promise<UserProfileRecord | null> => {
	try {
		const users = await getUserProfiles(prisma, { id });
		return users[0] ?? null;
	} catch (err) {
		logger.error("Error at getUserById", err);
		throw err;
	}
};

export const getUserProfilePictureValueById = async (
	userId: string,
): Promise<Prisma.JsonValue | null> => {
	try {
		const settings = await prisma.userSettings.findUnique({
			where: { userId },
			select: { profilePic: true },
		});

		return settings?.profilePic ?? null;
	} catch (err) {
		logger.error("Error at getUserProfilePictureValueById", err);
		throw err;
	}
};

export const getAllUsers = async (): Promise<UserProfileRecord[]> => {
	try {
		return await getUserProfiles(prisma);
	} catch (err) {
		logger.error("Error at getAllUsers", err);
		throw err;
	}
};

export const updateUser = async (
	id: string,
	data: UpdateUserInput,
): Promise<UserProfileRecord> => {
	try {
		const result = await prisma.$transaction(async (tx) => {
			if (data.firstName || data.lastName) {
				await tx.user.update({
					where: { id },
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

				await tx.userSettings.upsert({
					where: { userId: id },
					update: settingsData,
					create: {
						userId: id,
						theme: "light",
						...settingsData,
					},
				});
			}

			const users = await getUserProfiles(tx, { id });
			return users[0];
		});

		return result;
	} catch (err) {
		logger.error("Error at updateUser", err);
		throw err;
	}
};

export const updateProfilePicture = async (
	userId: string,
	profilePic: Prisma.InputJsonValue | typeof Prisma.JsonNull,
): Promise<void> => {
	try {
		await prisma.userSettings.upsert({
			where: { userId },
			update: { profilePic },
			create: {
				userId,
				profilePic,
				theme: "light",
			},
		});
	} catch (err) {
		logger.error("Error at updateProfilePicture", err);
		throw err;
	}
};

export const deleteUserAndEnqueueMediaCleanupJobs = async (
	id: string,
): Promise<void> => {
	try {
		const cleanupBatchId = randomUUID();

		await prisma.$transaction(async (tx) => {
			const [settings, products] = await Promise.all([
				tx.userSettings.findUnique({
					where: { userId: id },
					select: {
						id: true,
						profilePic: true,
					},
				}),
				tx.product.findMany({
					where: { sellerId: id },
					select: {
						id: true,
						images: true,
					},
				}),
			]);

			const mediaCleanupJobs = getAccountMediaCleanupJobInputs({
				cleanupBatchId,
				userId: id,
				settings,
				products,
			});

			if (mediaCleanupJobs.length > 0) {
				await tx.mediaCleanupJob.createMany({
					data: mediaCleanupJobs,
				});
			}

			await tx.user.delete({
				where: { id },
			});
		});
	} catch (err) {
		logger.error("Error at deleteUserAndEnqueueMediaCleanupJobs", err);
		throw err;
	}
};
