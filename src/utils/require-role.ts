import type { QueryClient } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { RoleDescription } from "@/constants/role-description";
import {
	optionalAuthUserQueryOpt,
	refreshAuthUser,
} from "@/lib/tanstack-query/auth-user-query";
import type { UserRole } from "@/types/enum";
import type { UserProfile } from "@/types/user";

async function getAuthUser(
	queryClient: QueryClient,
): Promise<UserProfile | null> {
	const cachedUser = queryClient.getQueryData<UserProfile | null>(
		optionalAuthUserQueryOpt.queryKey,
	);

	if (cachedUser) {
		return cachedUser;
	}

	try {
		return await refreshAuthUser(queryClient);
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
