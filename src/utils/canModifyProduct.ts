import type { UserProfile } from "@/types/user";

export function canModifyProduct(user: UserProfile | null, sellerId: string) {
	if (!user) return false;
	if (user.role === "ADMIN") return true;
	if (user.role === "SELLER") return user.id === sellerId;
	return false;
}

export function isActionDisabled(
	actionKey: string,
	canEditOrDelete: boolean,
	isPending: boolean,
	isApproved: boolean,
) {
	if (actionKey === "edit" || actionKey === "delete") {
		return !canEditOrDelete || isPending;
	}

	if (actionKey === "approve" || actionKey === "decline") {
		return isApproved || isPending;
	}

	return false;
}
