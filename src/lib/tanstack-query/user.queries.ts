import { apiFetch } from "@/lib/tanstack-query/fetch";
import type { UserProfile } from "@/types/user";

export const getCurrentUser = async (): Promise<UserProfile> => {
	const res = await apiFetch<{ data: UserProfile }>("/api/user");
	return res.data;
};
