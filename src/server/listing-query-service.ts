import { z } from "zod";
import { parseOptionalListingPriceInputToAmountMinor } from "@/domains/listings/application/listing-money";
import {
	APPROVED_LISTING_SEARCH_MAX_LIMIT,
	APPROVED_LISTING_SHOP_PAGE_SIZE,
	type ApprovedListingSearchPort,
	type ApprovedListingSearchQuery,
	type CartListingQueryPort,
	getListingDetails,
	type ListingCountQueryPort,
	type ListingDetailQueryPort,
	listCartListings,
	listPendingModerationListings,
	listSellerListings,
	type PendingModerationListingQueryPort,
	RECENT_APPROVED_LISTINGS_LIMIT,
	type RecentApprovedListingQueryPort,
	type SellerListingQueryPort,
} from "@/domains/listings/application/listing-queries";
import {
	LISTING_CATEGORIES,
	LISTING_CONDITIONS,
} from "@/domains/listings/domain/listing-attributes";
import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingDetailResponse,
	ListingDetailView,
	ListingResponse,
	ListingStatusCount,
	ListingView,
} from "@/domains/listings/dto/listing-view";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";

type PrismaListingQueryPort = ListingDetailQueryPort &
	ApprovedListingSearchPort &
	SellerListingQueryPort &
	PendingModerationListingQueryPort &
	ListingCountQueryPort &
	RecentApprovedListingQueryPort &
	CartListingQueryPort;

const listingCategorySchema = z.enum(LISTING_CATEGORIES);
const listingConditionSchema = z.enum(LISTING_CONDITIONS);

const optionalListingPriceInputSchema = z
	.string()
	.nullable()
	.optional()
	.transform((value, ctx) => {
		try {
			return parseOptionalListingPriceInputToAmountMinor(value);
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message:
					error instanceof Error ? error.message : "Invalid listing price",
			});

			return z.NEVER;
		}
	});

const approvedListingSearchInputSchema = z
	.object({
		limit: z
			.string()
			.nullable()
			.transform((v) => (v ? Number(v) : APPROVED_LISTING_SHOP_PAGE_SIZE))
			.pipe(z.number().min(1).max(APPROVED_LISTING_SEARCH_MAX_LIMIT)),

		offset: z
			.string()
			.nullable()
			.transform((v) => (v ? Number(v) : 0))
			.pipe(z.number().min(0)),

		random: z
			.string()
			.nullable()
			.transform((v) => v === "true"),

		category: listingCategorySchema.nullable().optional(),
		condition: listingConditionSchema.nullable().optional(),
		brand: z.string().nullable().optional(),
		search: z.string().nullable().optional(),
		priceMin: optionalListingPriceInputSchema,
		priceMax: optionalListingPriceInputSchema,
	})
	.transform(({ priceMin, priceMax, ...query }) => ({
		...query,
		priceMinAmountMinor: priceMin,
		priceMaxAmountMinor: priceMax,
	}));

type ApprovedListingSearchInput = z.infer<
	typeof approvedListingSearchInputSchema
>;

const cartListingDetailsInputSchema = z.object({
	ids: z
		.array(z.string().trim().min(1, "Listing ID is required"))
		.min(1, "At least one listing ID is required")
		.max(100, "Maximum 100 listing IDs are allowed"),
});

export async function getListingDetailsResponse(
	actor: Actor | null,
	listingId: string,
	listings?: ListingDetailQueryPort,
): Promise<ListingDetailResponse> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	const result = await getListingDetails(actor, listingId, listingQueries);

	return toListingDetailResponse(unwrapResultOrThrowRequestError(result));
}

export async function searchApprovedListingResponses(
	rawQuery: unknown,
	listings?: ApprovedListingSearchPort,
): Promise<ListingResponse[]> {
	const parsed = approvedListingSearchInputSchema.safeParse(rawQuery);

	if (!parsed.success) {
		throw new RequestError("Invalid listing queries", {
			details: parsed.error,
		});
	}

	const listingQueries = listings ?? (await createPrismaListingQueries());
	const query = toListingSearchQuery(parsed.data);
	const listingViews = await listingQueries.searchApproved(query);

	return listingViews.map(toListingResponse);
}

export async function listSellerListingResponses(
	actor: Actor,
	listings?: SellerListingQueryPort,
): Promise<ListingResponse[]> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	const result = await listSellerListings(actor, listingQueries);

	return unwrapResultOrThrowRequestError(result).map(toListingResponse);
}

export async function listPendingModerationListingResponses(
	actor: Actor,
	listings?: PendingModerationListingQueryPort,
): Promise<ListingResponse[]> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	const result = await listPendingModerationListings(actor, listingQueries);

	return unwrapResultOrThrowRequestError(result).map(toListingResponse);
}

export async function getPopularListingBrandCountDtos(
	listings?: Pick<ListingCountQueryPort, "listPopularApprovedBrandCounts">,
): Promise<ListingBrandCount[]> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	return listingQueries.listPopularApprovedBrandCounts();
}

export async function getListingCategoryCountDtos(
	listings?: Pick<ListingCountQueryPort, "countApprovedByCategory">,
): Promise<ListingCategoryCount[]> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	return listingQueries.countApprovedByCategory();
}

export async function getListingStatusCountDto(
	isApproved: boolean,
	listings?: Pick<ListingCountQueryPort, "countByStatus">,
): Promise<ListingStatusCount> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	const status = isApproved ? "APPROVED" : "PENDING";
	const count = await listingQueries.countByStatus(status);

	return isApproved
		? { approvedListingCount: count }
		: { pendingListingCount: count };
}

export async function listRecentListingResponses(
	limit: number = RECENT_APPROVED_LISTINGS_LIMIT,
	listings?: RecentApprovedListingQueryPort,
): Promise<ListingResponse[]> {
	const listingQueries = listings ?? (await createPrismaListingQueries());
	const listingViews = await listingQueries.listRecentApproved(limit);

	return listingViews.map(toListingResponse);
}

export async function listCartListingResponses(
	actor: Actor,
	rawQuery: unknown,
	listings?: CartListingQueryPort,
): Promise<ListingResponse[]> {
	const parsed = cartListingDetailsInputSchema.safeParse(rawQuery);

	if (!parsed.success) {
		throw new RequestError("Invalid listing IDs query", {
			details: parsed.error,
		});
	}

	const listingQueries = listings ?? (await createPrismaListingQueries());
	const uniqueIds = Array.from(new Set(parsed.data.ids));
	const result = await listCartListings(actor, uniqueIds, listingQueries);

	return unwrapResultOrThrowRequestError(result).map(toListingResponse);
}

async function createPrismaListingQueries(): Promise<PrismaListingQueryPort> {
	const [{ prisma }, queries] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-queries"),
	]);

	return new queries.PrismaListingQueries(prisma);
}

function toListingSearchQuery(
	query: ApprovedListingSearchInput,
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
	const { createdAt, updatedAt, listingStatus, ...fields } = listing;

	return {
		...fields,
		isApproved: listingStatus === "APPROVED",
		listingStatus,
		createdAt: createdAt?.toISOString(),
		updatedAt: updatedAt?.toISOString(),
	};
}

function toListingDetailResponse(
	listing: ListingDetailView,
): ListingDetailResponse {
	const {
		viewerCanEdit,
		viewerCanDelete,
		viewerCanApprove,
		viewerCanDecline,
		...view
	} = listing;

	return {
		...toListingResponse(view),
		viewerCanEdit,
		viewerCanDelete,
		viewerCanApprove,
		viewerCanDecline,
	};
}
