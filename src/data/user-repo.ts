import type {
	Prisma,
	PrismaClient,
	User,
	UserSettings,
} from "generated/prisma/client";
import { logger } from "@/lib/logger";
import type { UpdateUserInput } from "@/lib/zod/user-validation";

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
	db?: DbClient,
): Promise<UserProfileRecord | null> => {
	try {
		const users = await getUserProfiles(db ?? (await getDefaultPrisma()), {
			id,
		});
		return users[0] ?? null;
	} catch (err) {
		logger.error("Error at getUserById", err);
		throw err;
	}
};

export const getUserProfilePictureValueById = async (
	userId: string,
	db?: DbClient,
): Promise<Prisma.JsonValue | null> => {
	try {
		const settings = await (
			db ?? (await getDefaultPrisma())
		).userSettings.findUnique({
			where: { userId },
			select: { profilePic: true },
		});

		return settings?.profilePic ?? null;
	} catch (err) {
		logger.error("Error at getUserProfilePictureValueById", err);
		throw err;
	}
};

export const getAllUsers = async (
	db?: DbClient,
): Promise<UserProfileRecord[]> => {
	try {
		return await getUserProfiles(db ?? (await getDefaultPrisma()));
	} catch (err) {
		logger.error("Error at getAllUsers", err);
		throw err;
	}
};

export const updateUser = async (
	id: string,
	data: UpdateUserInput,
	db?: PrismaClient,
): Promise<UserProfileRecord> => {
	try {
		const result = await (db ?? (await getDefaultPrisma())).$transaction(
			async (tx) => {
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
			},
		);

		return result;
	} catch (err) {
		logger.error("Error at updateUser", err);
		throw err;
	}
};

export const updateProfilePicture = async (
	userId: string,
	profilePic: Prisma.InputJsonValue | typeof Prisma.JsonNull,
	db?: DbClient,
): Promise<void> => {
	try {
		await (db ?? (await getDefaultPrisma())).userSettings.upsert({
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

export const deleteUser = async (id: string, db?: DbClient): Promise<void> => {
	try {
		await (db ?? (await getDefaultPrisma())).user.delete({
			where: { id },
		});
	} catch (err) {
		logger.error("Error at deleteUser", err);
		throw err;
	}
};

async function getDefaultPrisma() {
	const { prisma } = await import("@/data/connect-db");
	return prisma;
}
