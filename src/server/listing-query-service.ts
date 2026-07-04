import { z } from "zod";
import { parseOptionalListingPriceInputToAmountMinor } from "@/domains/listings/application/listing-money";
import {
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
	type RecentApprovedListingQueryPort,
	type SellerListingQueryPort,
} from "@/domains/listings/application/listing-queries";
import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingResponse,
	ListingStatusCount,
	ListingView,
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

const listingCategorySchema = z.enum([
	"ELECTRIC",
	"ACOUSTIC",
	"KEYBOARD",
	"PEDALS",
	"ACCESSORY",
]);
const listingConditionSchema = z.enum(["NEW", "USED", "MINT"]);

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
			.transform((v) => (v ? Number(v) : 12))
			.pipe(z.number().min(1).max(100)),

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
	actor: Actor,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const result = await listSellerListings(actor, queryDependencies.listings);

	if (!result.ok) {
		return toListingQueryServiceError(result.error);
	}

	return result.value.map(toListingResponse);
}

export async function listPendingModerationListingResponses(
	actor: Actor,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
	const queryDependencies =
		dependencies ?? (await createPrismaListingQueryDependencies());
	const result = await listPendingModerationListings(
		actor,
		queryDependencies.listings,
	);

	if (!result.ok) {
		return toListingQueryServiceError(result.error);
	}

	return result.value.map(toListingResponse);
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
	actor: Actor,
	rawQuery: unknown,
	dependencies?: ListingQueryServiceDependencies,
): Promise<ListingResponse[] | ListingQueryServiceError> {
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
	const result = await listCartListings(
		actor,
		uniqueIds,
		queryDependencies.listings,
	);

	if (!result.ok) {
		return toListingQueryServiceError(result.error);
	}

	return result.value.map(toListingResponse);
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

function toListingQueryServiceError(error: { readonly message: string }) {
	return { error: error.message };
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
