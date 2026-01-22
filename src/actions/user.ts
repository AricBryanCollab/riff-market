import { createServerFn } from "@tanstack/react-start";
import { getAllUsers, getUserById, updateUser } from "@/data/user.repo";
import {
	type UpdateUserInput,
	udpateUserSchema,
} from "@/lib/zod/user.validation";
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
