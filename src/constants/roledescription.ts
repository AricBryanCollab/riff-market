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
		description: "Lists and sells products on the marketplace",
	},
	CUSTOMER: {
		label: "Buyer",
		description: "Browses and buys products",
	},
};
