import { createServerFn } from "@tanstack/react-start";
import { getAllUsers, getUserById } from "@/data/user.repo";
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
