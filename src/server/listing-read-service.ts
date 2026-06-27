import {
	type ApprovedListingSearchPort,
	type ApprovedListingSearchQuery,
	type CartListingReadPort,
	getListingDetails,
	type ListingCountReadPort,
	type ListingDetailReadPort,
	listSellerListings,
	type PendingModerationListingReadPort,
	type RecentApprovedListingReadPort,
	type SellerListingReadPort,
} from "@/domains/listings/application/listing-read-models";
import {
	approvedListingProductApiQuerySchema,
	type ListingCategoryCount,
	type ListingReadDto,
	type ListingReadModel,
	type ListingStatusCount,
	listingCartDetailsProductApiQuerySchema,
} from "@/domains/listings/dto/listing-read-model";

export type ListingReadServiceDependencies = {
	readonly listings: ListingDetailReadPort &
		ApprovedListingSearchPort &
		SellerListingReadPort &
		PendingModerationListingReadPort &
		ListingCountReadPort &
		RecentApprovedListingReadPort &
		CartListingReadPort;
};

type ProductApiReadError = {
	readonly error: string;
	readonly details?: object;
};

export async function getListingDetailsForProductApi(
	listingId: string,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadDto | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const result = await getListingDetails(listingId, readDependencies.listings);

	if (!result.ok) {
		return { error: result.error.message };
	}

	if (!isPublicProductApiListingVisible(result.value)) {
		return { error: "Listing not found" };
	}

	return toProductApiListingReadModel(result.value);
}

export async function getApprovedListingsForProductApi(
	rawQuery: unknown,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadDto[] | ProductApiReadError> {
	const parsed = approvedListingProductApiQuerySchema.safeParse(rawQuery);

	if (!parsed.success) {
		return {
			error: "Invalid product queries",
			details: parsed.error,
		};
	}

	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const query = toListingSearchQuery(parsed.data);
	const listings = await readDependencies.listings.searchApproved(query);

	return listings.map(toProductApiListingReadModel);
}

export async function getSellerListingsForProductApi(
	sellerId: string,
	role: string,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadDto[] | ProductApiReadError> {
	if (role !== "SELLER" || !sellerId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const result = await listSellerListings(sellerId, readDependencies.listings);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toProductApiListingReadModel);
}

export async function getPendingModerationListingsForProductApi(
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadDto[] | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const listings = await readDependencies.listings.listPendingModeration();

	return listings.map(toProductApiListingReadModel);
}

export async function getListingCategoryCountsForProductApi(
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingCategoryCount[] | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	return readDependencies.listings.countApprovedByCategory();
}

export async function getListingStatusCountForProductApi(
	isApproved: boolean,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingStatusCount | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const status = isApproved ? "APPROVED" : "PENDING";
	const count = await readDependencies.listings.countByStatus(status);

	return isApproved
		? { approvedProductCount: count }
		: { pendingProductCount: count };
}

export async function getRecentListingsForProductApi(
	limit: number = 8,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadDto[] | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const listings = await readDependencies.listings.listRecentApproved(limit);

	return listings.map(toProductApiListingReadModel);
}

export async function getCartListingsForProductApi(
	role: string,
	rawQuery: unknown,
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingReadDto[] | ProductApiReadError> {
	if (role !== "CUSTOMER") {
		return { error: "Unauthorized, user must be a customer" };
	}

	const parsed = listingCartDetailsProductApiQuerySchema.safeParse(rawQuery);

	if (!parsed.success) {
		return {
			error: "Invalid product IDs query",
			details: parsed.error,
		};
	}

	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const uniqueIds = Array.from(new Set(parsed.data.ids));
	const listings = await readDependencies.listings.findByIds(uniqueIds);

	return listings.map(toProductApiListingReadModel);
}

async function createPrismaListingReadDependencies(): Promise<ListingReadServiceDependencies> {
	const [{ prisma }, readModels] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/listings/infrastructure/prisma-listing-read-models"),
	]);

	return {
		listings: new readModels.PrismaListingReadModels(prisma),
	};
}

function isPublicProductApiListingVisible(listing: ListingReadModel) {
	return listing.listingStatus === "APPROVED";
}

function toListingSearchQuery(
	query: ReturnType<typeof approvedListingProductApiQuerySchema.parse>,
): ApprovedListingSearchQuery {
	return {
		limit: query.limit,
		offset: query.offset,
		random: query.random,
		...(query.category && { category: query.category }),
		...(query.condition && { condition: query.condition }),
		...(query.brand && { brand: query.brand }),
		...(query.search && { search: query.search }),
		...(query.priceMinCents !== undefined && {
			priceMinCents: query.priceMinCents,
		}),
		...(query.priceMaxCents !== undefined && {
			priceMaxCents: query.priceMaxCents,
		}),
	};
}

function toProductApiListingReadModel(
	listing: ListingReadModel,
): ListingReadDto {
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
		price: listing.price,
		priceCents: listing.priceCents,
		currencyCode: listing.currencyCode,
		stock: listing.stock,
		isApproved: listing.listingStatus === "APPROVED",
		listingStatus: listing.listingStatus,
		createdAt: listing.createdAt?.toISOString(),
		updatedAt: listing.updatedAt?.toISOString(),
		seller: listing.seller,
	};
}
