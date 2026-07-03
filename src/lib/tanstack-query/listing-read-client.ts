import type {
	ApprovedListingCount,
	ListingBrandCountData,
	ListingCategoryCountData,
	ListingCountStatusQuery,
	ListingResponse,
	PendingListingCount,
} from "@/domains/listings/dto/listing-view";
import {
	type ApprovedListingSearchServerInput,
	getApprovedListingsListingApiFn,
	getCartListingsListingApiFn,
	getListingCategoryCountsListingApiFn,
	getListingDetailsListingApiFn,
	getListingStatusCountListingApiFn,
	getPendingModerationListingsListingApiFn,
	getPopularListingBrandCountsListingApiFn,
	getRecentListingsListingApiFn,
} from "@/server/listing-read.functions";

export type { ApprovedListingSearchServerInput };

type ListingResponseError = {
	readonly error: string;
	readonly details?: unknown;
};

export type ListingStatusCount = ApprovedListingCount | PendingListingCount;

export function unwrapListingResponseResult<T>(
	result: T | ListingResponseError,
): T {
	if (isListingResponseError(result)) {
		throw new Error(result.error);
	}

	return result;
}

export async function fetchApprovedListings(
	data: ApprovedListingSearchServerInput,
) {
	const result = await getApprovedListingsListingApiFn({ data });

	return unwrapListingResponseResult(result) as ListingResponse[];
}

export async function fetchListingDetails(listingId: string) {
	const result = await getListingDetailsListingApiFn({
		data: { listingId },
	});

	return unwrapListingResponseResult(result) as ListingResponse;
}

export async function fetchListingStatusCount(status: ListingCountStatusQuery) {
	const result = await getListingStatusCountListingApiFn({
		data: { status },
	});

	return unwrapListingResponseResult(result) as ListingStatusCount;
}

export async function fetchCartListings(listingIds: string[]) {
	const result = await getCartListingsListingApiFn({
		data: {
			ids: listingIds,
		},
	});

	return unwrapListingResponseResult(result) as ListingResponse[];
}

export async function fetchPendingModerationListings() {
	const result = await getPendingModerationListingsListingApiFn();

	return unwrapListingResponseResult(result) as ListingResponse[];
}

export async function fetchListingCategoryCounts() {
	const result = await getListingCategoryCountsListingApiFn();

	return unwrapListingResponseResult(result) as ListingCategoryCountData[];
}

export async function fetchPopularListingBrandCounts() {
	const result = await getPopularListingBrandCountsListingApiFn();

	return unwrapListingResponseResult(result) as ListingBrandCountData[];
}

export async function fetchRecentListings(limit: number) {
	const result = await getRecentListingsListingApiFn({
		data: { limit },
	});

	return unwrapListingResponseResult(result) as ListingResponse[];
}

function isListingResponseError(value: unknown): value is ListingResponseError {
	return (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof value.error === "string"
	);
}
