import type { ListingShopSearch } from "@/domains/listings/dto/listing-view";
import { getOptionalListingPriceSearchInput } from "@/utils/shop-search";

const getOptionalString = (value: unknown): string | undefined => {
	if (typeof value !== "string" || value.length === 0) {
		return undefined;
	}

	return value;
};

const getOptionalNumber = (value: unknown): number | undefined => {
	if (value === undefined || value === null || value === "") {
		return undefined;
	}

	const parsed = Number(value);

	if (!Number.isFinite(parsed)) {
		return undefined;
	}

	return parsed;
};

const getOptionalPage = (value: unknown): number | undefined => {
	const parsed = getOptionalNumber(value);

	if (parsed === undefined) {
		return undefined;
	}

	return Math.max(0, Math.floor(parsed));
};

export function validateListingSearch(
	search: Record<string, unknown>,
): ListingShopSearch {
	return {
		category: getOptionalString(search.category),
		brand: getOptionalString(search.brand),
		condition: getOptionalString(search.condition),
		search: getOptionalString(search.search),
		priceMin: getOptionalListingPriceSearchInput(search.priceMin),
		priceMax: getOptionalListingPriceSearchInput(search.priceMax),
		page: getOptionalPage(search.page),
	};
}
