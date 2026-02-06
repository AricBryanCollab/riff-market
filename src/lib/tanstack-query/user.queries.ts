import { apiFetch } from "@/lib/tanstack-query/fetch";
import type { UpdateUserRequest, UserProfile } from "@/types/user";

export const getCurrentUser = async (): Promise<UserProfile> => {
	const res = await apiFetch<{ data: UserProfile }>("/api/user");
	return res.data;
};

export const updateUserProfile = async (
	userData: UpdateUserRequest,
): Promise<UserProfile> => {
	return apiFetch<UserProfile>("/api/user", {
		method: "PUT",
		body: JSON.stringify(userData),
	});
};
