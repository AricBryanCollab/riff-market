import { redirect } from "@tanstack/react-router";
import { RoleDescription } from "@/constants/role-description";
import { useUserStore } from "@/store/user";
import type { UserRole } from "@/types/enum";

export function requireRole(allowedRoles: string[]) {
	const { user } = useUserStore.getState();

	if (!user || !allowedRoles.includes(user.role)) {
		throw redirect({ to: "/unauthorized" });
	}
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
