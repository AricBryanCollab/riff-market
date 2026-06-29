import type {
	ListingCategory,
	ListingCondition,
	Prisma,
	PrismaClient,
} from "generated/prisma/client";
import type {
	ListingCommandRepositoryPort,
	ListingMutationPersistenceInput,
	ListingMutationResult,
	ListingRemovalSnapshot,
} from "@/domains/listings/application/manage-listing";
import type { ListingStatus } from "@/domains/listings/domain/listing";
import { Money } from "@/domains/shared/domain/money";
import { toImageAssetRefs, toImageAssetUrls } from "@/utils/image-asset-ref";
import { normalizeListingMoney } from "../application/listing-money";

type DbClient = PrismaClient | Prisma.TransactionClient;

const listingCommandSelect = {
	id: true,
	sellerId: true,
	name: true,
	category: true,
	condition: true,
	brand: true,
	model: true,
	images: true,
	description: true,
	price: true,
	priceCents: true,
	currencyCode: true,
	stock: true,
	isApproved: true,
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
	_count: {
		select: {
			orderItems: true,
			reviews: true,
			favoritedBy: true,
		},
	},
} satisfies Prisma.ListingSelect;

type ListingCommandRow = Prisma.ListingGetPayload<{
	select: typeof listingCommandSelect;
}>;

export class PrismaListingCommandRepository
	implements ListingCommandRepositoryPort
{
	constructor(private readonly db: DbClient) {}

	async createListing(
		input: ListingMutationPersistenceInput,
	): Promise<ListingMutationResult | null> {
		if (!input.sellerId || !input.images) {
			return null;
		}

		const listing = await this.db.listing.create({
			data: {
				sellerId: input.sellerId,
				name: input.name ?? "",
				category: input.category as ListingCategory,
				condition: input.condition as ListingCondition,
				brand: input.brand ?? "",
				model: input.model ?? "",
				images: input.images as unknown as Prisma.InputJsonValue,
				description: input.description ?? "",
				price: input.price ?? 0,
				priceCents: input.priceCents,
				currencyCode: input.currencyCode ?? "USD",
				stock: input.stock ?? 0,
				isApproved: input.isApproved,
				listingStatus: input.status,
			},
			select: listingCommandSelect,
		});

		return toMutationResult(listing);
	}

	async findListingForMutation(
		listingId: string,
	): Promise<ListingRemovalSnapshot | null> {
		const listing = await this.db.listing.findUnique({
			where: { id: listingId },
			select: listingCommandSelect,
		});

		if (!listing) {
			return null;
		}

		const sellerOrderItems = await this.db.sellerOrderItem.count({
			where: { listingId },
		});

		return toRemovalSnapshot(listing, sellerOrderItems);
	}

	async updateListing(
		listingId: string,
		input: ListingMutationPersistenceInput,
	): Promise<ListingMutationResult | null> {
		const listing = await this.db.listing.update({
			where: { id: listingId },
			data: toUpdateData(input),
			select: listingCommandSelect,
		});

		return toMutationResult(listing);
	}

	async deleteListing(listingId: string): Promise<boolean> {
		await this.db.listing.delete({
			where: { id: listingId },
		});

		return true;
	}

	async saveListingStatus(
		listingId: string,
		status: ListingStatus,
	): Promise<ListingMutationResult | null> {
		const listing = await this.db.listing.update({
			where: { id: listingId },
			data: {
				listingStatus: status,
				isApproved: status === "APPROVED",
			},
			select: listingCommandSelect,
		});

		return toMutationResult(listing);
	}
}

function toUpdateData(
	input: ListingMutationPersistenceInput,
): Prisma.ListingUpdateInput {
	return {
		...(input.name !== undefined && { name: input.name }),
		...(input.category !== undefined && {
			category: input.category as ListingCategory,
		}),
		...(input.condition !== undefined && {
			condition: input.condition as ListingCondition,
		}),
		...(input.brand !== undefined && { brand: input.brand }),
		...(input.model !== undefined && { model: input.model }),
		...(input.description !== undefined && { description: input.description }),
		...(input.price !== undefined && { price: input.price }),
		...(input.priceCents !== undefined && { priceCents: input.priceCents }),
		...(input.currencyCode !== undefined && {
			currencyCode: input.currencyCode,
		}),
		...(input.stock !== undefined && { stock: input.stock }),
		...(input.images !== undefined && {
			images: input.images as unknown as Prisma.InputJsonValue,
		}),
		isApproved: input.isApproved,
		listingStatus: input.status,
	};
}

function toMutationResult(listing: ListingCommandRow): ListingMutationResult {
	const normalized = normalizeListingMoney(listing);

	return {
		id: listing.id,
		sellerId: listing.sellerId,
		name: listing.name,
		category: listing.category,
		condition: listing.condition,
		brand: listing.brand,
		model: listing.model,
		images: toImageAssetRefs(listing.images),
		description: listing.description,
		price: normalized.price,
		priceCents: listing.priceCents,
		currencyCode: listing.currencyCode,
		stock: listing.stock,
		isApproved: listing.isApproved,
		listingStatus: listing.listingStatus,
		createdAt: listing.createdAt,
		updatedAt: listing.updatedAt,
	};
}

function toRemovalSnapshot(
	listing: ListingCommandRow,
	sellerOrderItems: number,
): ListingRemovalSnapshot {
	const imageRefs = toImageAssetRefs(listing.images);
	const imageUrls = toImageAssetUrls(listing.images);
	const priceCents = listing.priceCents ?? Math.round(listing.price * 100);

	return {
		id: listing.id,
		sellerId: listing.sellerId,
		sellerDisplayName: getSellerDisplayName(listing.seller),
		name: listing.name,
		brand: listing.brand,
		model: listing.model,
		category: listing.category,
		condition: listing.condition,
		primaryImageUrl: imageUrls[0] ?? "missing-image",
		price: Money.fromCents(priceCents, listing.currencyCode ?? "USD"),
		stock: listing.stock,
		status: listing.listingStatus,
		images: imageRefs,
		referenceCounts: {
			legacyOrderItems: listing._count.orderItems,
			sellerOrderItems,
			reviews: listing._count.reviews,
			favorites: listing._count.favoritedBy,
		},
	};
}

function getSellerDisplayName(seller: {
	firstName: string;
	lastName: string;
	email: string;
}) {
	return (
		[seller.firstName, seller.lastName].filter(Boolean).join(" ").trim() ||
		seller.email
	);
}
