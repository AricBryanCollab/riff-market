import type { Prisma, PrismaClient } from "generated/prisma/client";
import type {
	ListingModerationNotifierPort,
	ListingModerationRepositoryPort,
	ListingModerationResult,
} from "@/domains/listings/application/moderate-listing";
import type {
	ListingSnapshot,
	ListingStatus,
} from "@/domains/listings/domain/listing";
import { Money } from "@/domains/shared/domain/money";
import { toImageAssetUrls } from "@/utils/image-asset-ref";

type DbClient = PrismaClient | Prisma.TransactionClient;

const listingModerationSelect = {
	id: true,
	sellerId: true,
	name: true,
	brand: true,
	model: true,
	category: true,
	condition: true,
	images: true,
	price: true,
	priceCents: true,
	currencyCode: true,
	stock: true,
	isApproved: true,
	listingStatus: true,
	seller: {
		select: {
			firstName: true,
			lastName: true,
		},
	},
} satisfies Prisma.ProductSelect;

export class PrismaListingModerationRepository
	implements ListingModerationRepositoryPort
{
	constructor(private readonly db: DbClient) {}

	async findListingForModeration(
		listingId: string,
	): Promise<ListingSnapshot | null> {
		const product = await this.db.product.findUnique({
			where: { id: listingId },
			select: listingModerationSelect,
		});

		if (!product) {
			return null;
		}

		const imageUrls = toImageAssetUrls(product.images);
		const priceCents = product.priceCents ?? Math.round(product.price * 100);

		return {
			id: product.id,
			sellerId: product.sellerId,
			sellerDisplayName: [product.seller.firstName, product.seller.lastName]
				.filter(Boolean)
				.join(" "),
			name: product.name,
			brand: product.brand,
			model: product.model,
			category: product.category,
			condition: product.condition,
			primaryImageUrl: imageUrls[0] ?? "",
			price: Money.fromCents(priceCents, product.currencyCode ?? "USD"),
			stock: product.stock,
			status: product.listingStatus,
		};
	}

	async saveListingStatus(
		listingId: string,
		status: ListingStatus,
	): Promise<ListingModerationResult | null> {
		const product = await this.db.product.update({
			where: { id: listingId },
			data: {
				listingStatus: status,
				isApproved: status === "APPROVED",
			},
			select: {
				id: true,
				name: true,
				sellerId: true,
				isApproved: true,
				listingStatus: true,
			},
		});

		return {
			id: product.id,
			name: product.name,
			sellerId: product.sellerId,
			status: product.listingStatus,
			isApproved: product.isApproved,
		};
	}
}

export class PrismaListingModerationNotifier
	implements ListingModerationNotifierPort
{
	constructor(private readonly db: DbClient) {}

	async notifyListingApproved(input: ListingModerationResult): Promise<void> {
		await this.db.notification.create({
			data: {
				userId: input.sellerId,
				message: `Great News! Your product ${input.name} has been approved and live at the RiffMarket shop`,
				isRead: false,
			},
		});
	}

	async notifyListingDeclined(input: ListingModerationResult): Promise<void> {
		await this.db.notification.create({
			data: {
				userId: input.sellerId,
				message: `Your product ${input.name} has been declined by the admin`,
				isRead: false,
			},
		});
	}
}
