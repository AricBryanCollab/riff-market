import type { UserRole } from "@/types/enum";
import type {
	GetApprovedProductsFilterQuery,
	ProductCountStatusQuery,
} from "@/types/product";

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
	products: {
		root: ["products"] as const,
		approved: (filters: GetApprovedProductsFilterQuery) =>
			["products", "approved", filters] as const,
		bySeller: ["products", "by-seller"] as const,
		cartDetails: (productIds: readonly string[]) =>
			["products", "cart-details", productIds] as const,
		countByCategory: ["products", "count", "by-category"] as const,
		countByStatus: (status: ProductCountStatusQuery) =>
			["products", "count", status] as const,
		detail: (id: string) => ["products", "detail", id] as const,
		featured: ["products", "featured"] as const,
		pending: ["products", "pending"] as const,
		recent: ["products", "recent"] as const,
	},
};
