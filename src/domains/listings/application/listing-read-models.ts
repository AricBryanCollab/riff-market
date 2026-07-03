import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingCountStatus,
	ListingReadCategory,
	ListingReadCondition,
	ListingReadModel,
} from "@/domains/listings/dto/listing-read-model";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type ListingReadErrorCode =
	| "LISTING_READ_INVALID_ID"
	| "LISTING_READ_NOT_FOUND";

export type ListingReadError = AppError<ListingReadErrorCode>;

export interface ListingDetailReadPort {
	findById(listingId: string): Promise<ListingReadModel | null>;
}

export type ApprovedListingSearchQuery = {
	readonly limit?: number;
	readonly offset?: number;
	readonly random?: boolean;
	readonly category?: ListingReadCategory;
	readonly condition?: ListingReadCondition;
	readonly brand?: string;
	readonly search?: string;
	readonly priceMinAmountMinor?: number;
	readonly priceMaxAmountMinor?: number;
};

export interface ApprovedListingSearchPort {
	searchApproved(
		query: ApprovedListingSearchQuery,
	): Promise<ListingReadModel[]>;
}

export interface SellerListingReadPort {
	listForSeller(sellerId: string): Promise<ListingReadModel[]>;
}

export interface PendingModerationListingReadPort {
	listPendingModeration(): Promise<ListingReadModel[]>;
}

export interface ListingCountReadPort {
	listPopularApprovedBrandCounts(): Promise<ListingBrandCount[]>;
	countApprovedByCategory(): Promise<ListingCategoryCount[]>;
	countByStatus(status: ListingCountStatus): Promise<number>;
}

export interface RecentApprovedListingReadPort {
	listRecentApproved(limit: number): Promise<ListingReadModel[]>;
}

export interface CartListingReadPort {
	findByIds(listingIds: string[]): Promise<ListingReadModel[]>;
}

export async function getListingDetails(
	listingId: string,
	listings: ListingDetailReadPort,
): Promise<Result<ListingReadModel, ListingReadError>> {
	if (listingId.trim().length === 0) {
		return err(
			listingReadError(
				"LISTING_READ_INVALID_ID",
				"Listing ID is required",
				"validation",
			),
		);
	}

	const listing = await listings.findById(listingId);
	if (!listing) {
		return err(
			listingReadError(
				"LISTING_READ_NOT_FOUND",
				"Listing not found",
				"not-found",
			),
		);
	}

	return ok(listing);
}

export async function listSellerListings(
	sellerId: string,
	listings: SellerListingReadPort,
): Promise<Result<ListingReadModel[], ListingReadError>> {
	if (sellerId.trim().length === 0) {
		return err(
			listingReadError(
				"LISTING_READ_INVALID_ID",
				"Seller ID is required",
				"validation",
			),
		);
	}

	return ok(await listings.listForSeller(sellerId));
}

function listingReadError(
	code: ListingReadErrorCode,
	message: string,
	kind: ListingReadError["kind"],
): ListingReadError {
	return {
		code,
		message,
		kind,
	};
}
