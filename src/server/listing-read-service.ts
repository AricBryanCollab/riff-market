import {
	type ApprovedListingSearchPort,
	type ApprovedListingSearchQuery,
	type CartListingReadPort,
	GetApprovedListingCategoryCounts,
	GetCartListingDetails,
	GetListingDetails,
	GetListingStatusCount,
	type ListingCountReadPort,
	type ListingDetailReadPort,
	ListPendingModerationListings,
	ListRecentApprovedListings,
	ListSellerListings,
	type PendingModerationListingReadPort,
	type RecentApprovedListingReadPort,
	SearchApprovedListings,
	type SellerListingReadPort,
} from "@/domains/listings/application/listing-read-models";
import {
	approvedListingProductApiQuerySchema,
	type ListingCategoryCount,
	type ListingReadModel,
	type ListingReadStatus,
	listingCartDetailsProductApiQuerySchema,
} from "@/domains/listings/dto/listing-read-model";
import type { ProductCategory, ProductCondition } from "@/types/enum";

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

type ProductApiListingReadModel = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: ProductCategory;
	readonly condition: ProductCondition;
	readonly brand: string;
	readonly model: string;
	readonly images: string[];
	readonly description: string;
	readonly price: number;
	readonly priceCents?: number | null;
	readonly currencyCode?: string | null;
	readonly stock: number;
	readonly isApproved: boolean;
	readonly listingStatus: ListingReadStatus;
	readonly createdAt?: string;
	readonly updatedAt?: string;
	readonly seller: ListingReadModel["seller"];
};

type ProductApiListingCountByStatus =
	| { readonly approvedProductCount: number }
	| { readonly pendingProductCount: number };

export async function getListingDetailsForProductApi(
	listingId: string,
	dependencies?: ListingReadServiceDependencies,
): Promise<ProductApiListingReadModel | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const getListingDetails = new GetListingDetails(readDependencies.listings);
	const result = await getListingDetails.execute(listingId);

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
): Promise<ProductApiListingReadModel[] | ProductApiReadError> {
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
	const searchApprovedListings = new SearchApprovedListings(
		readDependencies.listings,
	);
	const result = await searchApprovedListings.execute(query);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toProductApiListingReadModel);
}

export async function getSellerListingsForProductApi(
	sellerId: string,
	role: string,
	dependencies?: ListingReadServiceDependencies,
): Promise<ProductApiListingReadModel[] | ProductApiReadError> {
	if (role !== "SELLER" || !sellerId) {
		return { error: "Unauthorized, user must be a seller" };
	}

	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const listSellerListings = new ListSellerListings(readDependencies.listings);
	const result = await listSellerListings.execute(sellerId);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toProductApiListingReadModel);
}

export async function getPendingModerationListingsForProductApi(
	dependencies?: ListingReadServiceDependencies,
): Promise<ProductApiListingReadModel[] | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const listPendingModerationListings = new ListPendingModerationListings(
		readDependencies.listings,
	);
	const result = await listPendingModerationListings.execute();

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toProductApiListingReadModel);
}

export async function getListingCategoryCountsForProductApi(
	dependencies?: ListingReadServiceDependencies,
): Promise<ListingCategoryCount[] | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const getApprovedListingCategoryCounts = new GetApprovedListingCategoryCounts(
		readDependencies.listings,
	);
	const result = await getApprovedListingCategoryCounts.execute();

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value;
}

export async function getListingStatusCountForProductApi(
	isApproved: boolean,
	dependencies?: ListingReadServiceDependencies,
): Promise<ProductApiListingCountByStatus | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const getListingStatusCount = new GetListingStatusCount(
		readDependencies.listings,
	);
	const status = isApproved ? "APPROVED" : "PENDING";
	const result = await getListingStatusCount.execute(status);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return isApproved
		? { approvedProductCount: result.value }
		: { pendingProductCount: result.value };
}

export async function getRecentListingsForProductApi(
	limit: number = 8,
	dependencies?: ListingReadServiceDependencies,
): Promise<ProductApiListingReadModel[] | ProductApiReadError> {
	const readDependencies =
		dependencies ?? (await createPrismaListingReadDependencies());
	const listRecentApprovedListings = new ListRecentApprovedListings(
		readDependencies.listings,
	);
	const result = await listRecentApprovedListings.execute(limit);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toProductApiListingReadModel);
}

export async function getCartListingsForProductApi(
	role: string,
	rawQuery: unknown,
	dependencies?: ListingReadServiceDependencies,
): Promise<ProductApiListingReadModel[] | ProductApiReadError> {
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
	const getCartListingDetails = new GetCartListingDetails(
		readDependencies.listings,
	);
	const result = await getCartListingDetails.execute(uniqueIds);

	if (!result.ok) {
		return { error: result.error.message };
	}

	return result.value.map(toProductApiListingReadModel);
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
): ProductApiListingReadModel {
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
