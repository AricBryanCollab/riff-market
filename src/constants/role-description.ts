import type { UserRole } from "@/types/enum";

interface RoleInfo {
	label: string;
	description: string;
}

export const RoleDescription: Record<UserRole, RoleInfo> = {
	ADMIN: {
		label: "Admin",
		description: "Manages marketplace operations and approvals",
	},
	SELLER: {
		label: "Seller",
		description: "Creates listings and sells gear on the marketplace",
	},
	CUSTOMER: {
		label: "Buyer",
		description: "Browses and buys listed gear",
	},
};
