import type { Prisma, PrismaClient } from "generated/prisma/client";
import {
	normalizeListingMoney,
	toListingPriceRangePersistence,
} from "@/domains/listings/application/listing-money";
import type {
	ApprovedListingSearchPort,
	ApprovedListingSearchQuery,
	CartListingReadPort,
	ListingCountReadPort,
	ListingDetailReadPort,
	PendingModerationListingReadPort,
	RecentApprovedListingReadPort,
	SellerListingReadPort,
} from "@/domains/listings/application/listing-read-models";
import type {
	ListingCategoryCount,
	ListingCountStatus,
	ListingReadModel,
} from "@/domains/listings/dto/listing-read-model";
import { toImageAssetUrls } from "@/utils/image-asset-ref";

type ListingReadPrisma = Pick<PrismaClient, "listing">;

const listingReadSelect = {
	id: true,
	sellerId: true,
	name: true,
	category: true,
	condition: true,
	brand: true,
	model: true,
	images: true,
	description: true,
	priceCents: true,
	currencyCode: true,
	stock: true,
	listingStatus: true,
	createdAt: true,
	updatedAt: true,
	seller: {
		select: {
			firstName: true,
			lastName: true,
			email: true,
		},
	},
} satisfies Prisma.ListingSelect;

type ListingReadRow = Prisma.ListingGetPayload<{
	select: typeof listingReadSelect;
}>;

export class PrismaListingReadModels
	implements
		ListingDetailReadPort,
		ApprovedListingSearchPort,
		SellerListingReadPort,
		PendingModerationListingReadPort,
		ListingCountReadPort,
		RecentApprovedListingReadPort,
		CartListingReadPort
{
	constructor(private readonly db: ListingReadPrisma) {}

	async findById(listingId: string): Promise<ListingReadModel | null> {
		const listing = await this.db.listing.findFirst({
			where: {
				id: listingId,
			},
			select: listingReadSelect,
		});

		return listing ? toListingReadModel(listing) : null;
	}

	async searchApproved(
		query: ApprovedListingSearchQuery,
	): Promise<ListingReadModel[]> {
		const { limit = 12, offset = 0, random = false } = query;
		const where = toApprovedListingWhere(query);

		if (random) {
			const total = await this.db.listing.count({ where });
			const randomSkip =
				total > limit ? Math.floor(Math.random() * (total - limit)) : 0;

			const listings = await this.db.listing.findMany({
				where,
				select: listingReadSelect,
				take: limit,
				skip: randomSkip,
			});

			return toListingReadModels(listings);
		}

		const listings = await this.db.listing.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
			select: listingReadSelect,
			take: limit,
			skip: offset,
		});

		return toListingReadModels(listings);
	}

	async listForSeller(sellerId: string): Promise<ListingReadModel[]> {
		const listings = await this.db.listing.findMany({
			where: { sellerId },
			orderBy: {
				createdAt: "desc",
			},
			select: listingReadSelect,
		});

		return toListingReadModels(listings);
	}

	async listPendingModeration(): Promise<ListingReadModel[]> {
		const listings = await this.db.listing.findMany({
			where: { listingStatus: "PENDING" },
			orderBy: {
				createdAt: "desc",
			},
			select: listingReadSelect,
		});

		return toListingReadModels(listings);
	}

	async countApprovedByCategory(): Promise<ListingCategoryCount[]> {
		const groupedListings = await this.db.listing.groupBy({
			by: ["category"],
			where: {
				listingStatus: "APPROVED",
			},
			_count: {
				category: true,
			},
		});

		return groupedListings.map((listing) => ({
			category: listing.category,
			count: listing._count.category,
		}));
	}

	async countByStatus(status: ListingCountStatus): Promise<number> {
		return await this.db.listing.count({
			where: {
				listingStatus: status,
			},
		});
	}

	async listRecentApproved(limit: number): Promise<ListingReadModel[]> {
		const listings = await this.db.listing.findMany({
			where: { listingStatus: "APPROVED" },
			orderBy: { updatedAt: "desc" },
			select: listingReadSelect,
			take: limit,
		});

		return toListingReadModels(listings);
	}

	async findByIds(listingIds: string[]): Promise<ListingReadModel[]> {
		const listings = await this.db.listing.findMany({
			where: {
				id: {
					in: listingIds,
				},
			},
			select: listingReadSelect,
		});

		return toListingReadModels(listings);
	}
}

function toApprovedListingWhere(
	query: ApprovedListingSearchQuery,
): Prisma.ListingWhereInput {
	const priceRange = toListingPriceRangePersistence({
		priceMinCents: query.priceMinCents,
		priceMaxCents: query.priceMaxCents,
	});

	return {
		listingStatus: "APPROVED",
		...(query.category && {
			category: query.category,
		}),
		...(query.condition && {
			condition: query.condition,
		}),
		...(query.brand && {
			brand: {
				contains: query.brand,
				mode: "insensitive",
			},
		}),
		...(query.search && {
			OR: [
				{ name: { contains: query.search, mode: "insensitive" } },
				{ description: { contains: query.search, mode: "insensitive" } },
				{ brand: { contains: query.search, mode: "insensitive" } },
				{ model: { contains: query.search, mode: "insensitive" } },
			],
		}),
		...(priceRange && { priceCents: priceRange }),
	};
}

function toListingReadModels(listings: ListingReadRow[]) {
	return listings.map(toListingReadModel);
}

function toListingReadModel(listing: ListingReadRow): ListingReadModel {
	const normalized = normalizeListingMoney(listing);

	return {
		...normalized,
		images: toImageAssetUrls(normalized.images),
	};
}
