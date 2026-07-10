import type { ActorRole } from "@/domains/shared/domain/actor";
import type { ApprovedListingSearchFilterQuery } from "@/utils/shop-search";

export type ListingDetailViewerScope = "public" | "admin";
export type ListingCountStatusQuery = "approved" | "pending";

const listingKeys = {
	root: ["listings"] as const,
	detailRoot: ["listings", "detail"] as const,
	cartDetailsRoot: ["listings", "cart-details"] as const,
	approved: (filters: ApprovedListingSearchFilterQuery) =>
		["listings", "approved", filters] as const,
	cartDetails: (listingIds: readonly string[]) =>
		["listings", "cart-details", listingIds] as const,
	popularBrandCounts: ["listings", "popular-brand-counts"] as const,
	countByCategory: ["listings", "count", "by-category"] as const,
	countByStatus: (status: ListingCountStatusQuery) =>
		["listings", "count", status] as const,
	detail: (id: string, viewerScope: ListingDetailViewerScope) =>
		["listings", "detail", id, viewerScope] as const,
	featured: ["listings", "featured"] as const,
	pending: ["listings", "pending"] as const,
	recent: ["listings", "recent"] as const,
};

export function listingDetailViewerScopeForRole(
	role: ActorRole | null | undefined,
): ListingDetailViewerScope {
	return role === "ADMIN" ? "admin" : "public";
}

export const queryKeys = {
	auth: {
		root: ["auth"] as const,
		user: ["auth", "user"] as const,
	},
	notifications: {
		root: ["notifications"] as const,
		count: ["notifications", "count"] as const,
	},
	orders: {
		root: ["orders"] as const,
		byRole: (userRole: ActorRole) => ["orders", userRole] as const,
	},
	listings: listingKeys,
};
