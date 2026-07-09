import {
	canApproveListingStatus,
	canDeclineListingStatus,
} from "@/domains/listings/domain/listing";
import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingCountStatus,
	ListingDetailView,
	ListingView,
	ListingViewCategory,
	ListingViewCondition,
	ListingViewerCapabilities,
} from "@/domains/listings/dto/listing-view";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";
import { canModifyListing } from "./manage-listing";

export type { ListingViewerCapabilities } from "@/domains/listings/dto/listing-view";

export const APPROVED_LISTING_SHOP_PAGE_SIZE = 8;
export const RECENT_APPROVED_LISTINGS_LIMIT = 8;
export const FEATURED_LISTINGS_SAMPLE_SIZE = 5;
export const APPROVED_LISTING_SEARCH_MAX_LIMIT = 100;

export type ListingQueryErrorCode =
	| "LISTING_QUERY_UNAUTHORIZED"
	| "LISTING_QUERY_INVALID_ID"
	| "LISTING_QUERY_NOT_FOUND";

export type ListingQueryError = AppError<ListingQueryErrorCode>;

export type ListingViewerCapabilityInput = {
	readonly viewer: Actor | null;
	readonly sellerId: string;
	readonly listingStatus: ListingView["listingStatus"];
};

export interface ListingDetailQueryPort {
	findById(
		listingId: string,
		viewer: Actor | null,
	): Promise<ListingView | null>;
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
	searchApproved(
		query: ApprovedListingSearchQuery,
		viewer: Actor | null,
	): Promise<ListingView[]>;
}

export interface SellerListingQueryPort {
	listForSeller(sellerId: string, viewer: Actor | null): Promise<ListingView[]>;
}

export interface PendingModerationListingQueryPort {
	listPendingModeration(viewer: Actor | null): Promise<ListingView[]>;
}

export interface ListingCountQueryPort {
	listPopularApprovedBrandCounts(): Promise<ListingBrandCount[]>;
	countApprovedByCategory(): Promise<ListingCategoryCount[]>;
	countByStatus(status: ListingCountStatus): Promise<number>;
}

export interface RecentApprovedListingQueryPort {
	listRecentApproved(
		limit: number,
		viewer: Actor | null,
	): Promise<ListingView[]>;
}

export interface CartListingQueryPort {
	findByIds(listingIds: string[], viewer: Actor | null): Promise<ListingView[]>;
}

export async function getListingDetails(
	actor: Actor | null,
	listingId: string,
	listings: ListingDetailQueryPort,
): Promise<Result<ListingDetailView, ListingQueryError>> {
	if (listingId.trim().length === 0) {
		return err(
			listingQueryError(
				"LISTING_QUERY_INVALID_ID",
				"Listing ID is required",
				"validation",
			),
		);
	}

	const listing = await listings.findById(listingId, actor);
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

	return ok({
		...listing,
		...deriveListingViewerCapabilities({
			viewer: actor,
			sellerId: listing.sellerId,
			listingStatus: listing.listingStatus,
		}),
	});
}

export async function listSellerListings(
	actor: Actor,
	listings: SellerListingQueryPort,
): Promise<Result<ListingView[], ListingQueryError>> {
	if (actor.role !== "SELLER") {
		return err(
			listingQueryError(
				"LISTING_QUERY_UNAUTHORIZED",
				"Only sellers can query seller listings",
				"authorization",
			),
		);
	}

	if (actor.id.trim().length === 0) {
		return err(
			listingQueryError(
				"LISTING_QUERY_INVALID_ID",
				"Seller ID is required",
				"validation",
			),
		);
	}

	return ok(await listings.listForSeller(actor.id, actor));
}

export async function listPendingModerationListings(
	actor: Actor,
	listings: PendingModerationListingQueryPort,
): Promise<Result<ListingView[], ListingQueryError>> {
	if (actor.role !== "ADMIN") {
		return err(
			listingQueryError(
				"LISTING_QUERY_UNAUTHORIZED",
				"Only admins can query pending moderation listings",
				"authorization",
			),
		);
	}

	return ok(await listings.listPendingModeration(actor));
}

export async function listCartListings(
	actor: Actor,
	listingIds: string[],
	listings: CartListingQueryPort,
): Promise<Result<ListingView[], ListingQueryError>> {
	if (actor.role !== "CUSTOMER") {
		return err(
			listingQueryError(
				"LISTING_QUERY_UNAUTHORIZED",
				"Only customers can query cart listings",
				"authorization",
			),
		);
	}

	return ok(await listings.findByIds(listingIds, actor));
}

export function deriveListingViewerCapabilities(
	input: ListingViewerCapabilityInput,
): ListingViewerCapabilities {
	const canModify = input.viewer
		? canModifyListing(input.viewer, input.sellerId)
		: false;
	const canModerate = input.viewer?.role === "ADMIN";

	return {
		viewerCanEdit: canModify,
		viewerCanDelete: canModify,
		viewerCanApprove:
			canModerate && canApproveListingStatus(input.listingStatus),
		viewerCanDecline:
			canModerate && canDeclineListingStatus(input.listingStatus),
	};
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
