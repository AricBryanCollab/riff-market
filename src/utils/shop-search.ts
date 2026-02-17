import type {
	GetApprovedProductsFilterQuery,
	ShopSearch,
} from "@/types/product";

export const SHOP_PAGE_SIZE = 8;

export const getShopPage = (searchParams: ShopSearch): number => {
	const rawPage = searchParams.page;

	if (typeof rawPage !== "number" || !Number.isFinite(rawPage)) {
		return 0;
	}

	return Math.max(0, Math.floor(rawPage));
};

export const getApprovedFiltersFromSearch = (
	searchParams: ShopSearch,
): GetApprovedProductsFilterQuery => {
	const page = getShopPage(searchParams);

	return {
		limit: SHOP_PAGE_SIZE,
		offset: page * SHOP_PAGE_SIZE,
		category: searchParams.category,
		brand: searchParams.brand,
		condition: searchParams.condition,
		search: searchParams.search,
		priceMin: searchParams.priceMin,
		priceMax: searchParams.priceMax,
	};
};
