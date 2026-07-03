import type { Prisma, PrismaClient } from "generated/prisma/client";
import { toListingPriceRangePersistence } from "@/domains/listings/application/listing-money";
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
import {
	normalizeListingBrand,
	toListingBrandKey,
} from "@/domains/listings/domain/listing-brand";
import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingCountStatus,
	ListingReadModel,
} from "@/domains/listings/dto/listing-read-model";
import { toListingImageDtos } from "@/utils/image-asset-ref";

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
	priceAmountMinor: true,
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

const popularListingBrandCountLimit = 12;

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

	async listPopularApprovedBrandCounts(): Promise<ListingBrandCount[]> {
		const groupedListings = await this.db.listing.groupBy({
			by: ["brand"],
			where: {
				listingStatus: "APPROVED",
				brand: {
					not: "",
				},
			},
			_count: {
				brand: true,
			},
		});

		return toNormalizedBrandCounts(groupedListings).slice(
			0,
			popularListingBrandCountLimit,
		);
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
		priceMinAmountMinor: query.priceMinAmountMinor,
		priceMaxAmountMinor: query.priceMaxAmountMinor,
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
		...(priceRange && { priceAmountMinor: priceRange }),
	};
}

function toNormalizedBrandCounts(
	groupedListings: readonly {
		readonly brand: string;
		readonly _count: { readonly brand: number };
	}[],
): ListingBrandCount[] {
	const brandCountsByKey = new Map<
		string,
		{
			count: number;
			displayCounts: Map<string, number>;
		}
	>();

	for (const listing of groupedListings) {
		const displayBrand = normalizeListingBrand(listing.brand);
		const brandKey = toListingBrandKey(displayBrand);

		if (!brandKey) {
			continue;
		}

		const existing = brandCountsByKey.get(brandKey);
		if (!existing) {
			brandCountsByKey.set(brandKey, {
				count: listing._count.brand,
				displayCounts: new Map([[displayBrand, listing._count.brand]]),
			});
			continue;
		}

		existing.count += listing._count.brand;
		existing.displayCounts.set(
			displayBrand,
			(existing.displayCounts.get(displayBrand) ?? 0) + listing._count.brand,
		);
	}

	return Array.from(brandCountsByKey.values())
		.map(({ count, displayCounts }) => ({
			brand: mostCommonDisplayBrand(displayCounts),
			count,
		}))
		.sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
}

function mostCommonDisplayBrand(displayCounts: ReadonlyMap<string, number>) {
	return Array.from(displayCounts.entries()).sort(
		([leftBrand, leftCount], [rightBrand, rightCount]) =>
			rightCount - leftCount || leftBrand.localeCompare(rightBrand),
	)[0][0];
}

function toListingReadModels(listings: ListingReadRow[]) {
	return listings.map(toListingReadModel);
}

function toListingReadModel(listing: ListingReadRow): ListingReadModel {
	return {
		...listing,
		images: toListingImageDtos(listing.images),
	};
}
