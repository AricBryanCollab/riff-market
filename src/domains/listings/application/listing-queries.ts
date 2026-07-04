import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingCountStatus,
	ListingView,
	ListingViewCategory,
	ListingViewCondition,
} from "@/domains/listings/dto/listing-view";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type ListingQueryErrorCode =
	| "LISTING_QUERY_INVALID_ID"
	| "LISTING_QUERY_NOT_FOUND";

export type ListingQueryError = AppError<ListingQueryErrorCode>;

export interface ListingDetailQueryPort {
	findById(listingId: string): Promise<ListingView | null>;
}

export type ApprovedListingSearchQuery = {
	readonly limit?: number;
	readonly offset?: number;
	readonly random?: boolean;
	readonly category?: ListingViewCategory;
	readonly condition?: ListingViewCondition;
	readonly brand?: string;
	readonly search?: string;
	readonly priceMinAmountMinor?: number;
	readonly priceMaxAmountMinor?: number;
};

export interface ApprovedListingSearchPort {
	searchApproved(query: ApprovedListingSearchQuery): Promise<ListingView[]>;
}

export interface SellerListingQueryPort {
	listForSeller(sellerId: string): Promise<ListingView[]>;
}

export interface PendingModerationListingQueryPort {
	listPendingModeration(): Promise<ListingView[]>;
}

export interface ListingCountQueryPort {
	listPopularApprovedBrandCounts(): Promise<ListingBrandCount[]>;
	countApprovedByCategory(): Promise<ListingCategoryCount[]>;
	countByStatus(status: ListingCountStatus): Promise<number>;
}

export interface RecentApprovedListingQueryPort {
	listRecentApproved(limit: number): Promise<ListingView[]>;
}

export interface CartListingQueryPort {
	findByIds(listingIds: string[]): Promise<ListingView[]>;
}

export async function getListingDetails(
	actor: Actor | null,
	listingId: string,
	listings: ListingDetailQueryPort,
): Promise<Result<ListingView, ListingQueryError>> {
	if (listingId.trim().length === 0) {
		return err(
			listingQueryError(
				"LISTING_QUERY_INVALID_ID",
				"Listing ID is required",
				"validation",
			),
		);
	}

	const listing = await listings.findById(listingId);
	if (!listing) {
		return err(
			listingQueryError(
				"LISTING_QUERY_NOT_FOUND",
				"Listing not found",
				"not-found",
			),
		);
	}

	if (!canReadListingDetails(actor, listing)) {
		return err(
			listingQueryError(
				"LISTING_QUERY_NOT_FOUND",
				"Listing not found",
				"not-found",
			),
		);
	}

	return ok(listing);
}

export async function listSellerListings(
	sellerId: string,
	listings: SellerListingQueryPort,
): Promise<Result<ListingView[], ListingQueryError>> {
	if (sellerId.trim().length === 0) {
		return err(
			listingQueryError(
				"LISTING_QUERY_INVALID_ID",
				"Seller ID is required",
				"validation",
			),
		);
	}

	return ok(await listings.listForSeller(sellerId));
}

function listingQueryError(
	code: ListingQueryErrorCode,
	message: string,
	kind: ListingQueryError["kind"],
): ListingQueryError {
	return {
		code,
		message,
		kind,
	};
}

function canReadListingDetails(actor: Actor | null, listing: ListingView) {
	if (listing.listingStatus === "APPROVED") {
		return true;
	}

	return actor?.role === "ADMIN" && listing.listingStatus === "PENDING";
}
