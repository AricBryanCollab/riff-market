import type { ShopSearch } from "@/types/product";

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

export function validateProductSearch(
	search: Record<string, unknown>,
): ShopSearch {
	return {
		category: getOptionalString(search.category),
		brand: getOptionalString(search.brand),
		condition: getOptionalString(search.condition),
		search: getOptionalString(search.search),
		priceMin: getOptionalNumber(search.priceMin),
		priceMax: getOptionalNumber(search.priceMax),
		page: getOptionalPage(search.page),
	};
}
