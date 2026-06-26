import type { Prisma, PrismaClient } from "generated/prisma/client";
import type {
	ListingApprovedEvent,
	ListingDeclinedEvent,
	ListingModerationNotifierPort,
	ListingModerationRepositoryPort,
	ListingModerationResult,
} from "@/domains/listings/application/moderate-listing";
import type {
	ListingSnapshot,
	ListingStatus,
} from "@/domains/listings/domain/listing";
import { createListingModerationNotification } from "@/domains/notifications/application/notification-event-handlers";
import { PrismaNotifications } from "@/domains/notifications/infrastructure/prisma-notifications";
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
		expectedStatus: ListingStatus,
	): Promise<ListingModerationResult | null> {
		const updated = await this.db.product.updateMany({
			where: {
				id: listingId,
				listingStatus: expectedStatus,
			},
			data: {
				listingStatus: status,
				isApproved: status === "APPROVED",
			},
		});

		if (updated.count === 0) {
			return null;
		}

		const product = await this.db.product.findUnique({
			where: { id: listingId },
			select: {
				id: true,
				name: true,
				sellerId: true,
				isApproved: true,
				listingStatus: true,
			},
		});

		if (!product) {
			return null;
		}

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
	private readonly notifications: PrismaNotifications;

	constructor(db: DbClient) {
		this.notifications = new PrismaNotifications(db);
	}

	async notifyListingApproved(
		input: ListingModerationResult,
		event: ListingApprovedEvent,
	): Promise<void> {
		await this.notifyListingModeration(input, event);
	}

	async notifyListingDeclined(
		input: ListingModerationResult,
		event: ListingDeclinedEvent,
	): Promise<void> {
		await this.notifyListingModeration(input, event);
	}

	private async notifyListingModeration(
		input: ListingModerationResult,
		event: ListingApprovedEvent | ListingDeclinedEvent,
	): Promise<void> {
		await createListingModerationNotification(
			{
				event,
				listingName: input.name,
			},
			this.notifications,
		);
	}
}
