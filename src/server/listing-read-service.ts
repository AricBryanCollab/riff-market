import {
	type ApprovedListingSearchPort,
	type ApprovedListingSearchQuery,
	type CartListingQueryPort,
	getListingDetails,
	type ListingCountQueryPort,
	type ListingDetailQueryPort,
	listSellerListings,
	type PendingModerationListingQueryPort,
	type RecentApprovedListingQueryPort,
	type SellerListingQueryPort,
} from "@/domains/listings/application/listing-queries";
import {
	approvedListingSearchInputSchema,
	cartListingDetailsInputSchema,
	type ListingBrandCount,
	type ListingCategoryCount,
	type ListingResponse,
	type ListingStatusCount,
	type ListingView,
} from "@/domains/listings/dto/listing-view";
import type { Actor } from "@/domains/shared/domain/actor";

export type ListingQueryServiceDependencies = {
	readonly listings: ListingDetailQueryPort &
		ApprovedListingSearchPort &
		SellerListingQueryPort &
		PendingModerationListingQueryPort &
		ListingCountQueryPort &
		RecentApprovedListingQueryPort &
		CartListingQueryPort;
};

type ListingQueryServiceError = {
	readonly error: string;
	readonly details?: object;
};

export async function getListingDetailsResponse(
	actor: Actor | null,
	listingId: string,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const result = await getListingDetails(
		actor,
		listingId,
		queryDependencies.listings,
	);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return toListingResponse(result.value);
}

export async function searchApprovedListingResponses(
	rawQuery: unknown,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	const parsed = approvedListingSearchInputSchema.safeParse(rawQuery);

	if (!parsed.success) {
		return {
			error: "Invalid listing queries",
			details: parsed.error,
		};
	}

	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const query = toListingSearchQuery(parsed.data);
	const listings = await queryDependencies.listings.searchApproved(query);

	return listings.map(toListingResponse);
}

export async function listSellerListingResponses(
	sellerId: string,
	role: string,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	if (role !== "SELLER" || !sellerId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const result = await listSellerListings(sellerId, queryDependencies.listings);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toListingResponse);
}

export async function listPendingModerationListingResponses(
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const listings = await queryDependencies.listings.listPendingModeration();

	return listings.map(toListingResponse);
}

export async function getPopularListingBrandCountDtos(
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingBrandCount[] | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	return queryDependencies.listings.listPopularApprovedBrandCounts();
}

export async function getListingCategoryCountDtos(
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingCategoryCount[] | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	return queryDependencies.listings.countApprovedByCategory();
}

export async function getListingStatusCountDto(
	isApproved: boolean,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingStatusCount | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const status = isApproved ? "APPROVED" : "PENDING";
	const count = await queryDependencies.listings.countByStatus(status);

	return isApproved
		? { approvedListingCount: count }
		: { pendingListingCount: count };
}

export async function listRecentListingResponses(
	limit: number = 8,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const listings = await queryDependencies.listings.listRecentApproved(limit);

	return listings.map(toListingResponse);
}

export async function listCartListingResponses(
	role: string,
	rawQuery: unknown,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	if (role !== "CUSTOMER") {
		return { error: "Unauthorized, user must be a customer" };
	}

	const parsed = cartListingDetailsInputSchema.safeParse(rawQuery);

	if (!parsed.success) {
		return {
			error: "Invalid listing IDs query",
			details: parsed.error,
		};
	}

	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const uniqueIds = Array.from(new Set(parsed.data.ids));
	const listings = await queryDependencies.listings.findByIds(uniqueIds);

	return listings.map(toListingResponse);
}

async function createPrismaListingQueryDependencies(): Promise<ListingQueryServiceDependencies> {
	const [{ prisma }, queries] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-queries"),
	]);

	return {
		listings: new queries.PrismaListingQueries(prisma),
	};
}

function toListingSearchQuery(
	query: ReturnType<typeof approvedListingSearchInputSchema.parse>,
): ApprovedListingSearchQuery {
	return {
		limit: query.limit,
		offset: query.offset,
		random: query.random,
		...(query.category && { category: query.category }),
		...(query.condition && { condition: query.condition }),
		...(query.brand && { brand: query.brand }),
		...(query.search && { search: query.search }),
		...(query.priceMinAmountMinor !== undefined && {
			priceMinAmountMinor: query.priceMinAmountMinor,
		}),
		...(query.priceMaxAmountMinor !== undefined && {
			priceMaxAmountMinor: query.priceMaxAmountMinor,
		}),
	};
}

function toListingResponse(listing: ListingView): ListingResponse {
	return {
		id: listing.id,
		sellerId: listing.sellerId,
		name: listing.name,
		category: listing.category,
		condition: listing.condition,
		brand: listing.brand,
		model: listing.model,
		images: listing.images,
		description: listing.description,
		priceAmountMinor: listing.priceAmountMinor,
		currencyCode: listing.currencyCode,
		stock: listing.stock,
		isApproved: listing.listingStatus === "APPROVED",
		listingStatus: listing.listingStatus,
		createdAt: listing.createdAt?.toISOString(),
		updatedAt: listing.updatedAt?.toISOString(),
		seller: listing.seller,
	};
}
