import type {
	ListingReadCategory,
	ListingReadCondition,
	ListingReadModel,
} from "@/domains/listings/dto/listing-read-model";
import {
	type AppError,
	appError,
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
	readonly priceMinCents?: number;
	readonly priceMaxCents?: number;
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

export class GetListingDetails {
	constructor(private readonly listings: ListingDetailReadPort) {}

	async execute(
		listingId: string,
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

		const listing = await this.listings.findById(listingId);
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
}

export class SearchApprovedListings {
	constructor(private readonly listings: ApprovedListingSearchPort) {}

	async execute(
		query: ApprovedListingSearchQuery,
	): Promise<Result<ListingReadModel[], ListingReadError>> {
		return ok(await this.listings.searchApproved(query));
	}
}

export class ListSellerListings {
	constructor(private readonly listings: SellerListingReadPort) {}

	async execute(
		sellerId: string,
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

		return ok(await this.listings.listForSeller(sellerId));
	}
}

export class ListPendingModerationListings {
	constructor(private readonly listings: PendingModerationListingReadPort) {}

	async execute(): Promise<Result<ListingReadModel[], ListingReadError>> {
		return ok(await this.listings.listPendingModeration());
	}
}

function listingReadError(
	code: ListingReadErrorCode,
	message: string,
	kind: ListingReadError["kind"],
): ListingReadError {
	return appError({
		code,
		message,
		kind,
	});
}
