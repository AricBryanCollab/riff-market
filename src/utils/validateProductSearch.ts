import type { ShopSearch } from "@/types/product";

export function validateProductSearch(
	search: Record<string, unknown>,
): ShopSearch {
	return {
		category: search.category as string | undefined,
		brand: search.brand as string | undefined,
		condition: search.condition as string | undefined,
		search: search.search as string | undefined,
		priceMin: search.priceMin ? Number(search.priceMin) : undefined,
		priceMax: search.priceMax ? Number(search.priceMax) : undefined,
		page: search.page ? Number(search.page) : undefined,
	};
}
