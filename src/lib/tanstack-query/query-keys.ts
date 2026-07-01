import type {
	ApprovedListingSearchFilterQuery,
	ListingCountStatusQuery,
} from "@/domains/listings/dto/listing-read-model";
import type { UserRole } from "@/types/enum";

const listingKeys = {
	root: ["listings"] as const,
	approved: (filters: ApprovedListingSearchFilterQuery) =>
		["listings", "approved", filters] as const,
	cartDetails: (listingIds: readonly string[]) =>
		["listings", "cart-details", listingIds] as const,
	countByCategory: ["listings", "count", "by-category"] as const,
	countByStatus: (status: ListingCountStatusQuery) =>
		["listings", "count", status] as const,
	detail: (id: string) => ["listings", "detail", id] as const,
	featured: ["listings", "featured"] as const,
	pending: ["listings", "pending"] as const,
	recent: ["listings", "recent"] as const,
};

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
		byRole: (userRole: UserRole) => ["orders", userRole] as const,
	},
	listings: listingKeys,
};
