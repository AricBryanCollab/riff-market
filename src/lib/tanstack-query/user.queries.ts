import { apiFetch } from "@/lib/tanstack-query/fetch";
import type { UserProfile } from "@/types/user";

export const getCurrentUser = async (): Promise<UserProfile> => {
	return apiFetch<UserProfile>("/api/user");
};
