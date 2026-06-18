import type {
	Prisma,
	PrismaClient,
	ProductCategory,
	ProductCondtion,
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
import { normalizeProductMoney } from "../application/product-money";

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
} satisfies Prisma.ProductSelect;

type ListingCommandProduct = Prisma.ProductGetPayload<{
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

		const product = await this.db.product.create({
			data: {
				sellerId: input.sellerId,
				name: input.name ?? "",
				category: input.category as ProductCategory,
				condition: input.condition as ProductCondtion,
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

		return toMutationResult(product);
	}

	async findListingForMutation(
		listingId: string,
	): Promise<ListingRemovalSnapshot | null> {
		const product = await this.db.product.findUnique({
			where: { id: listingId },
			select: listingCommandSelect,
		});

		if (!product) {
			return null;
		}

		const sellerOrderItems = await this.db.sellerOrderItem.count({
			where: { listingId },
		});

		return toRemovalSnapshot(product, sellerOrderItems);
	}

	async updateListing(
		listingId: string,
		input: ListingMutationPersistenceInput,
	): Promise<ListingMutationResult | null> {
		const product = await this.db.product.update({
			where: { id: listingId },
			data: toUpdateData(input),
			select: listingCommandSelect,
		});

		return toMutationResult(product);
	}

	async deleteListing(listingId: string): Promise<boolean> {
		await this.db.product.delete({
			where: { id: listingId },
		});

		return true;
	}

	async saveListingStatus(
		listingId: string,
		status: ListingStatus,
	): Promise<ListingMutationResult | null> {
		const product = await this.db.product.update({
			where: { id: listingId },
			data: {
				listingStatus: status,
				isApproved: status === "APPROVED",
			},
			select: listingCommandSelect,
		});

		return toMutationResult(product);
	}
}

function toUpdateData(
	input: ListingMutationPersistenceInput,
): Prisma.ProductUpdateInput {
	return {
		...(input.name !== undefined && { name: input.name }),
		...(input.category !== undefined && {
			category: input.category as ProductCategory,
		}),
		...(input.condition !== undefined && {
			condition: input.condition as ProductCondtion,
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

function toMutationResult(
	product: ListingCommandProduct,
): ListingMutationResult {
	const normalized = normalizeProductMoney(product);

	return {
		id: product.id,
		sellerId: product.sellerId,
		name: product.name,
		category: product.category,
		condition: product.condition,
		brand: product.brand,
		model: product.model,
		images: toImageAssetRefs(product.images),
		description: product.description,
		price: normalized.price,
		priceCents: product.priceCents,
		currencyCode: product.currencyCode,
		stock: product.stock,
		isApproved: product.isApproved,
		listingStatus: product.listingStatus,
		createdAt: product.createdAt,
		updatedAt: product.updatedAt,
	};
}

function toRemovalSnapshot(
	product: ListingCommandProduct,
	sellerOrderItems: number,
): ListingRemovalSnapshot {
	const imageRefs = toImageAssetRefs(product.images);
	const imageUrls = toImageAssetUrls(product.images);
	const priceCents = product.priceCents ?? Math.round(product.price * 100);

	return {
		id: product.id,
		sellerId: product.sellerId,
		sellerDisplayName: getSellerDisplayName(product.seller),
		name: product.name,
		brand: product.brand,
		model: product.model,
		category: product.category,
		condition: product.condition,
		primaryImageUrl: imageUrls[0] ?? "missing-image",
		price: Money.fromCents(priceCents, product.currencyCode ?? "USD"),
		stock: product.stock,
		status: product.listingStatus,
		images: imageRefs,
		referenceCounts: {
			legacyOrderItems: product._count.orderItems,
			sellerOrderItems,
			reviews: product._count.reviews,
			favorites: product._count.favoritedBy,
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
