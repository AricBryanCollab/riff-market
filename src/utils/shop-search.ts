import { normalizeOptionalListingPriceInput } from "@/domains/listings/application/listing-money";
import { APPROVED_LISTING_SHOP_PAGE_SIZE } from "@/domains/listings/application/listing-queries";

export const SHOP_PAGE_SIZE = APPROVED_LISTING_SHOP_PAGE_SIZE;

// Human-entered listing price in marketplace currency, not minor units.
export type ListingPriceInput = string;

export type ApprovedListingSearchFilterQuery = {
	readonly limit?: number;
	readonly offset?: number;
	readonly category?: string;
	readonly brand?: string;
	readonly search?: string;
	readonly condition?: string;
	readonly priceMin?: ListingPriceInput;
	readonly priceMax?: ListingPriceInput;
};

export type ListingShopSearch = {
	readonly category?: string;
	readonly brand?: string;
	readonly condition?: string;
	readonly search?: string;
	readonly priceMin?: ListingPriceInput;
	readonly priceMax?: ListingPriceInput;
	readonly page?: number;
};

export type OptionalListingPriceSearchInputResult =
	| {
			readonly status: "empty";
	  }
	| {
			readonly status: "valid";
			readonly value: string;
	  }
	| {
			readonly status: "invalid";
			readonly message: string;
	  };

export const getShopPage = (searchParams: ListingShopSearch): number => {
	const rawPage = searchParams.page;

	if (typeof rawPage !== "number" || !Number.isFinite(rawPage)) {
		return 0;
	}

	return Math.max(0, Math.floor(rawPage));
};

export const getApprovedFiltersFromSearch = (
	searchParams: ListingShopSearch,
): ApprovedListingSearchFilterQuery => {
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

export const getOptionalListingPriceSearchInput = (
	value: unknown,
): string | undefined => {
	const result = parseOptionalListingPriceSearchInput(value);

	return result.status === "valid" ? result.value : undefined;
};

export const parseOptionalListingPriceSearchInput = (
	value: unknown,
): OptionalListingPriceSearchInputResult => {
	try {
		const normalized = normalizeOptionalListingPriceInput(value);

		return normalized === undefined
			? { status: "empty" }
			: { status: "valid", value: normalized };
	} catch (error) {
		return {
			status: "invalid",
			message:
				error instanceof Error
					? error.message
					: "Listing price filter is invalid",
		};
	}
};
