import type { Prisma, PrismaClient } from "generated/prisma/client";
import { toListingPriceRangePersistence } from "@/domains/listings/application/listing-money";
import type {
	ApprovedListingSearchPort,
	ApprovedListingSearchQuery,
	CartListingQueryPort,
	ListingCountQueryPort,
	ListingDetailQueryPort,
	PendingModerationListingQueryPort,
	RecentApprovedListingQueryPort,
	SellerListingQueryPort,
} from "@/domains/listings/application/listing-queries";
import {
	normalizeListingBrand,
	toListingBrandKey,
} from "@/domains/listings/domain/listing-brand";
import type {
	ListingBrandCount,
	ListingCategoryCount,
	ListingCountStatus,
	ListingView,
} from "@/domains/listings/dto/listing-view";
import { toListingImageDtos } from "@/utils/image-asset-ref";

type ListingQueryPrisma = Pick<PrismaClient, "listing">;

const listingViewSelect = {
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

type ListingViewRow = Prisma.ListingGetPayload<{
	select: typeof listingViewSelect;
}>;

const popularListingBrandCountLimit = 12;

export class PrismaListingQueries
	implements
		ListingDetailQueryPort,
		ApprovedListingSearchPort,
		SellerListingQueryPort,
		PendingModerationListingQueryPort,
		ListingCountQueryPort,
		RecentApprovedListingQueryPort,
		CartListingQueryPort
{
	constructor(private readonly db: ListingQueryPrisma) {}

	async findById(listingId: string): Promise<ListingView | null> {
		const listing = await this.db.listing.findFirst({
			where: {
				id: listingId,
			},
			select: listingViewSelect,
		});

		return listing ? toListingView(listing) : null;
	}

	async searchApproved(
		query: ApprovedListingSearchQuery,
	): Promise<ListingView[]> {
		const { limit = 12, offset = 0, random = false } = query;
		const where = toApprovedListingWhere(query);

		if (random) {
			const total = await this.db.listing.count({ where });
			const randomSkip =
				total > limit ? Math.floor(Math.random() * (total - limit)) : 0;

			const listings = await this.db.listing.findMany({
				where,
				select: listingViewSelect,
				take: limit,
				skip: randomSkip,
			});

			return toListingViews(listings);
		}

		const listings = await this.db.listing.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
			select: listingViewSelect,
			take: limit,
			skip: offset,
		});

		return toListingViews(listings);
	}

	async listForSeller(sellerId: string): Promise<ListingView[]> {
		const listings = await this.db.listing.findMany({
			where: { sellerId },
			orderBy: {
				createdAt: "desc",
			},
			select: listingViewSelect,
		});

		return toListingViews(listings);
	}

	async listPendingModeration(): Promise<ListingView[]> {
		const listings = await this.db.listing.findMany({
			where: { listingStatus: "PENDING" },
			orderBy: {
				createdAt: "desc",
			},
			select: listingViewSelect,
		});

		return toListingViews(listings);
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

	async listRecentApproved(limit: number): Promise<ListingView[]> {
		const listings = await this.db.listing.findMany({
			where: { listingStatus: "APPROVED" },
			orderBy: { updatedAt: "desc" },
			select: listingViewSelect,
			take: limit,
		});

		return toListingViews(listings);
	}

	async findByIds(listingIds: string[]): Promise<ListingView[]> {
		const listings = await this.db.listing.findMany({
			where: {
				id: {
					in: listingIds,
				},
			},
			select: listingViewSelect,
		});

		return toListingViews(listings);
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

function toListingViews(listings: ListingViewRow[]) {
	return listings.map(toListingView);
}

function toListingView(listing: ListingViewRow): ListingView {
	return {
		...listing,
		images: toListingImageDtos(listing.images),
	};
}
