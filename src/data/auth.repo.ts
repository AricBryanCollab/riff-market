import type { User, UserSettings } from "generated/prisma/client";
import { prisma } from "@/data/connectDb";

type ReqUser = Omit<User, "id" | "createdAt" | "updatedAt">;
type CreateUserResult = {
	user: User;
	settings: UserSettings;
};
export const findUserByEmail = async (email: string) => {
	try {
		const user = await prisma.user.findFirst({
			where: {
				email,
			},
		});
		return user;
	} catch (err) {
		console.error("Error at findUserByEmail", err);
		throw err;
	}
};

export const findUserById = async (id: string) => {
	try {
		const user = await prisma.user.findFirst({
			where: {
				id,
			},
		});

		return user;
	} catch (err) {
		console.error("Error at findUserById", err);
		throw err;
	}
};

export const createUser = async (user: ReqUser): Promise<CreateUserResult> => {
	try {
		return prisma.$transaction(async (tx) => {
			const newUser = await tx.user.create({
				data: {
					firstName: user.firstName,
					lastName: user.lastName,
					email: user.email,
					password: user.password,
					role: user.role,
				},
			});

			const settings = await tx.userSettings.create({
				data: {
					userId: newUser.id,
					theme: "light",
					phone: null,
					address: null,
					profilePic: null,
				},
			});

			return { user: newUser, settings };
		});
	} catch (err) {
		console.error("Error at createUser", err);
		throw err;
	}
};
