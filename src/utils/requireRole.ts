import { redirect } from "@tanstack/react-router";
import { useUserStore } from "@/store/user";

export function requireRole(allowedRoles: string[]) {
	const { user } = useUserStore.getState();

	if (!user || !allowedRoles.includes(user.role)) {
		throw redirect({ to: "/unauthorized" });
	}
}
