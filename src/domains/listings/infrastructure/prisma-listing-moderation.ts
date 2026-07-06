import type { Prisma, PrismaClient } from "generated/prisma/client";
import type {
	ListingApprovedEvent,
	ListingDeclinedEvent,
	ListingModerationNotifierPort,
	ListingModerationRepositoryPort,
	ListingModerationResult,
	ListingModerationWorkflowPort,
	ModerateListingCommand,
	ModerateListingResult,
} from "@/domains/listings/application/moderate-listing";
import { moderateListing } from "@/domains/listings/application/moderate-listing";
import type {
	ListingSnapshot,
	ListingStatus,
} from "@/domains/listings/domain/listing";
import { createListingModerationNotification } from "@/domains/notifications/application/notification-event-handlers";
import { PrismaNotifications } from "@/domains/notifications/infrastructure/prisma-notifications";
import type { Actor } from "@/domains/shared/domain/actor";
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
	priceAmountMinor: true,
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
} satisfies Prisma.ListingSelect;

export class PrismaListingModerationWorkflow
	implements ListingModerationWorkflowPort
{
	constructor(private readonly db: PrismaClient) {}

	async moderate(
		actor: Actor,
		command: ModerateListingCommand,
	): Promise<ModerateListingResult> {
		return this.db.$transaction((transaction) =>
			moderateListing(
				actor,
				command,
				new PrismaListingModerationRepository(transaction),
				new PrismaListingModerationNotifier(transaction),
			),
		);
	}
}

export class PrismaListingModerationRepository
	implements ListingModerationRepositoryPort
{
	constructor(private readonly db: DbClient) {}

	async findListingForModeration(
		listingId: string,
	): Promise<ListingSnapshot | null> {
		const listing = await this.db.listing.findUnique({
			where: { id: listingId },
			select: listingModerationSelect,
		});

		if (!listing) {
			return null;
		}

		const imageUrls = toImageAssetUrls(listing.images);

		return {
			id: listing.id,
			sellerId: listing.sellerId,
			sellerDisplayName: [listing.seller.firstName, listing.seller.lastName]
				.filter(Boolean)
				.join(" "),
			name: listing.name,
			brand: listing.brand,
			model: listing.model,
			category: listing.category,
			condition: listing.condition,
			primaryImageUrl: imageUrls[0] ?? "",
			price: Money.fromMinor(listing.priceAmountMinor, listing.currencyCode),
			stock: listing.stock,
			status: listing.listingStatus,
		};
	}

	async saveListingStatus(
		listingId: string,
		status: ListingStatus,
		expectedStatus: ListingStatus,
	): Promise<ListingModerationResult | null> {
		const updated = await this.db.listing.updateMany({
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

		const listing = await this.db.listing.findUnique({
			where: { id: listingId },
			select: {
				id: true,
				name: true,
				sellerId: true,
				isApproved: true,
				listingStatus: true,
			},
		});

		if (!listing) {
			return null;
		}

		return {
			id: listing.id,
			name: listing.name,
			sellerId: listing.sellerId,
			status: listing.listingStatus,
			isApproved: listing.isApproved,
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
