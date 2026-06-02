import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { RoleDescription } from "@/constants/role-description";
import { getCurrentUserFn } from "@/server/user.functions";
import type { UserRole } from "@/types/enum";
import type { UserProfile } from "@/types/user";

const AUTH_USER_QUERY_KEY = ["auth", "user"] as const;

async function getAuthUser(
	queryClient: QueryClient,
): Promise<UserProfile | null> {
	const cachedUser = queryClient.getQueryData<UserProfile | null>(
		AUTH_USER_QUERY_KEY,
	);

	if (cachedUser) {
		return cachedUser;
	}

	try {
		return await queryClient.fetchQuery({
			queryKey: AUTH_USER_QUERY_KEY,
			queryFn: () => getCurrentUserFn(),
			retry: false,
			staleTime: 1000 * 60 * 5,
		});
	} catch {
		return null;
	}
}

export async function requireAuthUser(
	queryClient: QueryClient,
	redirectTo = "/unauthorized",
) {
	const user = await getAuthUser(queryClient);

	if (!user) {
		throw redirect({ to: redirectTo });
	}

	return user;
}

export async function requireRole(
	queryClient: QueryClient,
	allowedRoles: UserRole[],
) {
	const user = await requireAuthUser(queryClient, "/unauthorized");

	if (!user || !allowedRoles.includes(user.role)) {
		throw redirect({ to: "/unauthorized" });
	}

	return user;
}

export function getRoleInfo(role: string | null | undefined) {
	if (!role || !RoleDescription[role as UserRole]) {
		return {
			label: "Unknown",
			description: "Role information not available",
		};
	}
	return RoleDescription[role as UserRole];
}
