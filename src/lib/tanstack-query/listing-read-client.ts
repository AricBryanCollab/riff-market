import type {
	ApprovedListingCount,
	ListingCategoryCountData,
	ListingCountStatusQuery,
	ListingReadDto,
	PendingListingCount,
} from "@/domains/listings/dto/listing-read-model";
import {
	type ApprovedListingSearchServerInput,
	getApprovedListingsListingApiFn,
	getCartListingsListingApiFn,
	getListingCategoryCountsListingApiFn,
	getListingDetailsListingApiFn,
	getListingStatusCountListingApiFn,
	getPendingModerationListingsListingApiFn,
	getRecentListingsListingApiFn,
} from "@/server/listing-read.functions";

export type { ApprovedListingSearchServerInput };

type ListingReadError = {
	readonly error: string;
	readonly details?: unknown;
};

export type ListingStatusCount = ApprovedListingCount | PendingListingCount;

export function unwrapListingReadResult<T>(result: T | ListingReadError): T {
	if (isListingReadError(result)) {
		throw new Error(result.error);
	}

	return result;
}

export async function fetchApprovedListings(
	data: ApprovedListingSearchServerInput,
) {
	const result = await getApprovedListingsListingApiFn({ data });

	return unwrapListingReadResult(result) as ListingReadDto[];
}

export async function fetchListingDetails(listingId: string) {
	const result = await getListingDetailsListingApiFn({
		data: { listingId },
	});

	return unwrapListingReadResult(result) as ListingReadDto;
}

export async function fetchListingStatusCount(status: ListingCountStatusQuery) {
	const result = await getListingStatusCountListingApiFn({
		data: { status },
	});

	return unwrapListingReadResult(result) as ListingStatusCount;
}

export async function fetchCartListings(listingIds: string[]) {
	const result = await getCartListingsListingApiFn({
		data: {
			ids: listingIds,
		},
	});

	return unwrapListingReadResult(result) as ListingReadDto[];
}

export async function fetchPendingModerationListings() {
	const result = await getPendingModerationListingsListingApiFn();

	return unwrapListingReadResult(result) as ListingReadDto[];
}

export async function fetchListingCategoryCounts() {
	const result = await getListingCategoryCountsListingApiFn();

	return unwrapListingReadResult(result) as ListingCategoryCountData[];
}

export async function fetchRecentListings(limit: number) {
	const result = await getRecentListingsListingApiFn({
		data: { limit },
	});

	return unwrapListingReadResult(result) as ListingReadDto[];
}

function isListingReadError(value: unknown): value is ListingReadError {
	return (
		typeof value === "object" &&
		value !== null &&
		"error" in value &&
		typeof value.error === "string"
	);
}
