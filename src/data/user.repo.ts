import type {
	Prisma,
	PrismaClient,
	User,
	UserSettings,
} from "generated/prisma/client";
import { prisma } from "@/data/connectDb";
import type { UpdateUserRequest, UserProfile } from "@/types/user";

type DbClient = PrismaClient | Prisma.TransactionClient;

const getUserProfiles = async (
	db: DbClient,
	where?: Prisma.UserWhereInput,
): Promise<UserProfile[]> => {
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

export const getUserById = async (id: string): Promise<UserProfile | null> => {
	try {
		const users = await getUserProfiles(prisma, { id });
		return users[0] ?? null;
	} catch (err) {
		console.error("Error at getUserById", err);
		throw err;
	}
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
	try {
		return await getUserProfiles(prisma);
	} catch (err) {
		console.error("Error at getAllUsers", err);
		throw err;
	}
};

export const updateUser = async (
	id: string,
	data: UpdateUserRequest,
): Promise<UserProfile> => {
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
				data.theme
			) {
				await tx.userSettings.upsert({
					where: { userId: id },
					update: {
						phone: data.phone,
						address: data.address,
						theme: data.theme,
					},
					create: {
						userId: id,
						phone: data.phone ?? null,
						address: data.address ?? null,
						theme: data.theme ?? "light",
					},
				});
			}

			const users = await getUserProfiles(tx, { id });
			return users[0];
		});

		if (!result) throw new Error("User not found");
		return result;
	} catch (err) {
		console.error("Error at updateUser", err);
		throw err;
	}
};

export const updateProfilePicture = async (
	userId: string,
	profilePic: string | null,
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
		console.error("Error at updateProfilePicture", err);
		throw err;
	}
};
