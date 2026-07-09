import type { ActorRole } from "@/domains/shared/domain/actor";

interface RoleInfo {
	label: string;
	description: string;
}

export const RoleDescription: Record<ActorRole, RoleInfo> = {
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
