import type {
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

export interface ListingCountReadPort {
	countApprovedByCategory(): Promise<ListingCategoryCount[]>;
	countByStatus(status: ListingCountStatus): Promise<number>;
}

export interface RecentApprovedListingReadPort {
	listRecentApproved(limit: number): Promise<ListingReadModel[]>;
}

export interface CartListingReadPort {
	findByIds(listingIds: string[]): Promise<ListingReadModel[]>;
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

export class GetApprovedListingCategoryCounts {
	constructor(private readonly listings: ListingCountReadPort) {}

	async execute(): Promise<Result<ListingCategoryCount[], ListingReadError>> {
		return ok(await this.listings.countApprovedByCategory());
	}
}

export class GetListingStatusCount {
	constructor(private readonly listings: ListingCountReadPort) {}

	async execute(
		status: ListingCountStatus,
	): Promise<Result<number, ListingReadError>> {
		return ok(await this.listings.countByStatus(status));
	}
}

export class ListRecentApprovedListings {
	constructor(private readonly listings: RecentApprovedListingReadPort) {}

	async execute(
		limit: number = 8,
	): Promise<Result<ListingReadModel[], ListingReadError>> {
		return ok(await this.listings.listRecentApproved(limit));
	}
}

export class GetCartListingDetails {
	constructor(private readonly listings: CartListingReadPort) {}

	async execute(
		listingIds: string[],
	): Promise<Result<ListingReadModel[], ListingReadError>> {
		return ok(await this.listings.findByIds(listingIds));
	}
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
