import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import type { ListingImageManagerPort } from "@/domains/listings/application/manage-listing";
import {
	type ListingApprovedEvent,
	type ListingDeclinedEvent,
	type ListingModerationNotifierPort,
	type ListingModerationRepositoryPort,
	type ListingModerationResult,
	moderateListing,
} from "@/domains/listings/application/moderate-listing";
import { PrismaListingCommandRepository } from "@/domains/listings/infrastructure/prisma-listing-commands";
import {
	PrismaListingModerationNotifier,
	PrismaListingModerationRepository,
} from "@/domains/listings/infrastructure/prisma-listing-moderation";
import { PrismaNotifications } from "@/domains/notifications/infrastructure/prisma-notifications";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	createListingForCurrentUser,
	type ListingModerationServiceDependencies,
	moderateListingForCurrentUser,
	removeListingForCurrentUser,
	updateListingForCurrentUser,
	validateCreateListingFormData,
	validateUpdateListingFormData,
} from "@/server/listing-service";
import { getNotificationsForCurrentUser } from "@/server/notification-service";
import type { RequestError } from "@/server/request-error";
import {
	describeDb,
	seedListing,
	seedMarketplaceUsers,
	seedPurchaseWithSellerOrders,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";
import type { ImageAssetRef } from "@/types/image-asset";

describeDb("listing service Prisma integration", () => {
	let db: PrismaClient;
	let imageManager: FakeListingImageManager;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		await seedMarketplaceUsers(db);
		imageManager = new FakeListingImageManager();
	});

	it("creates seller listings through service, application, and Prisma infrastructure", async () => {
		const formData = new FormData();
		formData.append("name", "Smoke Telecaster");
		formData.append("category", "ELECTRIC");
		formData.append("condition", "USED");
		formData.append("brand", "Fender");
		formData.append("model", "American Standard");
		formData.append("description", "A vertical integration listing");
		formData.append("price", "19995");
		formData.append("stock", "3");
		formData.append("image", imageFile("listing.jpg"));

		const response = await createListingForCurrentUser(
			sellerUser(),
			validateCreateListingFormData(formData),
			commandDependencies(db, imageManager),
		);

		expect(response).toMatchObject({
			message: "New listing has been added",
			listing: {
				sellerId: "seller-1",
				name: "Smoke Telecaster",
				priceAmountMinor: 19995,
				currencyCode: "TWD",
				stock: 3,
				isApproved: false,
				listingStatus: "PENDING",
				images: [
					{
						imageId: "upload-1",
						url: "https://cdn.example.com/upload-1.jpg",
					},
				],
			},
		});
		expect(imageManager.uploadedFileNames).toEqual(["listing.jpg"]);

		const listing = await db.listing.findUniqueOrThrow({
			where: { id: response.listing.id },
		});
		expect(listing).toMatchObject({
			sellerId: "seller-1",
			name: "Smoke Telecaster",
			priceAmountMinor: 19995,
			currencyCode: "TWD",
			isApproved: false,
			listingStatus: "PENDING",
		});
	});

	it("updates seller listings back to pending and cleans up replaced images", async () => {
		await seedListing(db, {
			id: "listing-1",
			sellerId: "seller-1",
			isApproved: true,
			listingStatus: "APPROVED",
		});
		const formData = new FormData();
		formData.append("listingId", "listing-1");
		formData.append("name", "Updated Telecaster");
		formData.append("price", "24950");
		formData.append("image", imageFile("updated.jpg"));

		const response = await updateListingForCurrentUser(
			sellerUser(),
			validateUpdateListingFormData(formData),
			commandDependencies(db, imageManager),
		);

		expect(response.listing).toMatchObject({
			id: "listing-1",
			name: "Updated Telecaster",
			priceAmountMinor: 24950,
			isApproved: false,
			listingStatus: "PENDING",
			images: [
				{
					imageId: "upload-1",
					url: "https://cdn.example.com/upload-1.jpg",
				},
			],
		});
		expect(imageManager.cleanedImages).toEqual([
			{
				url: "https://cdn.example.com/listing-1.jpg",
				publicId: "listing-1",
			},
		]);

		const listing = await db.listing.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			name: "Updated Telecaster",
			priceAmountMinor: 24950,
			isApproved: false,
			listingStatus: "PENDING",
		});
	});

	it("lets admins update listings without resetting approval", async () => {
		await seedListing(db, {
			id: "listing-1",
			sellerId: "seller-1",
			isApproved: false,
			listingStatus: "PENDING",
		});

		await updateListingForCurrentUser(
			adminUser(),
			{
				listingId: "listing-1",
				data: {
					name: "Admin Curated Telecaster",
				},
			},
			commandDependencies(db, imageManager),
		);

		const listing = await db.listing.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			name: "Admin Curated Telecaster",
			isApproved: true,
			listingStatus: "APPROVED",
		});
	});

	it("moderates listings and creates seller notifications", async () => {
		await seedListing(db, {
			id: "listing-approve",
			sellerId: "seller-1",
			isApproved: false,
			listingStatus: "PENDING",
		});
		await seedListing(db, {
			id: "listing-decline",
			sellerId: "seller-1",
			name: "Declined Telecaster",
			isApproved: false,
			listingStatus: "PENDING",
		});

		await moderateListingForCurrentUser(
			adminUser(),
			{ listingId: "listing-approve", decision: "APPROVE" },
			moderationDependencies(db),
		);
		await moderateListingForCurrentUser(
			adminUser(),
			{ listingId: "listing-decline", decision: "DECLINE" },
			moderationDependencies(db),
		);

		const approved = await db.listing.findUniqueOrThrow({
			where: { id: "listing-approve" },
		});
		const declined = await db.listing.findUniqueOrThrow({
			where: { id: "listing-decline" },
		});
		expect(approved).toMatchObject({
			isApproved: true,
			listingStatus: "APPROVED",
		});
		expect(declined).toMatchObject({
			isApproved: false,
			listingStatus: "DECLINED",
		});

		const notifications = await db.notification.findMany({
			where: { userId: "seller-1" },
			orderBy: { createdAt: "asc" },
		});
		expect(notifications.map((notification) => notification.message)).toEqual([
			"Great News! Your listing Telecaster has been approved and live at the RiffMarket shop",
			"Your listing Declined Telecaster has been declined by the admin",
		]);
	});

	it("rolls back moderation status when notification creation fails", async () => {
		await seedListing(db, {
			id: "listing-rollback",
			sellerId: "seller-1",
			isApproved: false,
			listingStatus: "PENDING",
		});

		await expect(
			moderateListingForCurrentUser(
				adminUser(),
				{ listingId: "listing-rollback", decision: "APPROVE" },
				failingModerationDependencies(db),
			),
		).rejects.toThrow("Notification write failed");

		const listing = await db.listing.findUniqueOrThrow({
			where: { id: "listing-rollback" },
		});
		expect(listing).toMatchObject({
			isApproved: false,
			listingStatus: "PENDING",
		});

		const notifications = await db.notification.findMany({
			where: { userId: "seller-1" },
		});
		expect(notifications).toEqual([]);
	});

	it("returns conflict and does not notify when moderation status changes after read", async () => {
		await seedListing(db, {
			id: "listing-stale",
			sellerId: "seller-1",
			isApproved: false,
			listingStatus: "PENDING",
		});

		await expect(
			moderateListingForCurrentUser(
				adminUser(),
				{ listingId: "listing-stale", decision: "DECLINE" },
				staleStatusModerationDependencies(db),
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 409,
			code: "MODERATE_LISTING_STALE_STATUS",
		} satisfies Partial<RequestError>);

		const listing = await new PrismaListingModerationRepository(
			db,
		).findListingForModeration("listing-stale");
		expect(listing).toMatchObject({
			status: "APPROVED",
		});
		await expect(
			getNotificationsForCurrentUser(sellerUser(), new PrismaNotifications(db)),
		).resolves.toEqual([]);
	});

	it("hard-deletes unreferenced listings and cleans up images", async () => {
		await seedListing(db, {
			id: "listing-1",
			sellerId: "seller-1",
			isApproved: false,
			listingStatus: "PENDING",
		});

		const response = await removeListingForCurrentUser(
			sellerUser(),
			{ listingId: "listing-1" },
			commandDependencies(db, imageManager),
		);

		expect(response.listing).toEqual({
			listingId: "listing-1",
			mode: "DELETED",
			message: "Listing deleted successfully",
		});
		await expect(
			db.listing.findUnique({ where: { id: "listing-1" } }),
		).resolves.toBeNull();
		expect(imageManager.cleanedImages).toEqual([
			{
				url: "https://cdn.example.com/listing-1.jpg",
				publicId: "listing-1",
			},
		]);
	});

	it("withdraws referenced listings instead of deleting them", async () => {
		await seedListing(db, {
			id: "listing-1",
			sellerId: "seller-1",
			isApproved: true,
			listingStatus: "APPROVED",
		});
		await seedSellerOrderItemReference(db, "listing-1");

		const response = await removeListingForCurrentUser(
			sellerUser(),
			{ listingId: "listing-1" },
			commandDependencies(db, imageManager),
		);

		expect(response.listing).toEqual({
			listingId: "listing-1",
			mode: "WITHDRAWN",
			message: "Listing withdrawn successfully",
		});

		const listing = await db.listing.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			isApproved: false,
			listingStatus: "WITHDRAWN",
		});
		expect(imageManager.cleanedImages).toEqual([]);
	});

	it("blocks sellers from mutating another seller's listing", async () => {
		await seedListing(db, {
			id: "listing-1",
			sellerId: "seller-1",
			isApproved: true,
			listingStatus: "APPROVED",
		});

		await expect(
			updateListingForCurrentUser(
				sellerUser("seller-2"),
				{
					listingId: "listing-1",
					data: {
						name: "Blocked",
					},
				},
				commandDependencies(db, imageManager),
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 403,
			code: "LISTING_COMMAND_UNAUTHORIZED",
		} satisfies Partial<RequestError>);

		const listing = await db.listing.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			name: "Telecaster",
			isApproved: true,
			listingStatus: "APPROVED",
		});
	});
});

class FakeListingImageManager implements ListingImageManagerPort {
	uploadedFileNames: string[] = [];
	cleanedImages: ImageAssetRef[] = [];
	private nextUpload = 1;

	async uploadImages(imageFiles: File[]): Promise<ImageAssetRef[]> {
		this.uploadedFileNames.push(...imageFiles.map((file) => file.name));

		return imageFiles.map(() => {
			const index = this.nextUpload;
			this.nextUpload += 1;

			return {
				url: `https://cdn.example.com/upload-${index}.jpg`,
				publicId: `upload-${index}`,
			};
		});
	}

	async cleanupUploadedImagesBestEffort(
		images: ImageAssetRef[],
	): Promise<void> {
		this.cleanedImages.push(...images);
	}

	async cleanupPersistedImagesBestEffort(
		images: ImageAssetRef[],
	): Promise<void> {
		this.cleanedImages.push(...images);
	}
}

function commandDependencies(
	db: PrismaClient,
	imageManager: ListingImageManagerPort,
) {
	return {
		listings: new PrismaListingCommandRepository(db),
		images: imageManager,
	};
}

function moderationDependencies(
	db: PrismaClient,
): ListingModerationServiceDependencies {
	return {
		moderateListing: (actor, command) =>
			db.$transaction((transaction) =>
				moderateListing(
					actor,
					command,
					new PrismaListingModerationRepository(transaction),
					new PrismaListingModerationNotifier(transaction),
				),
			),
	};
}

function failingModerationDependencies(
	db: PrismaClient,
): ListingModerationServiceDependencies {
	return {
		moderateListing: (actor, command) =>
			db.$transaction((transaction) =>
				moderateListing(
					actor,
					command,
					new PrismaListingModerationRepository(transaction),
					new FailingListingModerationNotifier(),
				),
			),
	};
}

function staleStatusModerationDependencies(
	db: PrismaClient,
): ListingModerationServiceDependencies {
	return {
		moderateListing: (actor, command) =>
			moderateListing(
				actor,
				command,
				new StaleStatusListingModerationRepository(db),
				new PrismaListingModerationNotifier(db),
			),
	};
}

class StaleStatusListingModerationRepository
	implements ListingModerationRepositoryPort
{
	private readonly delegate: PrismaListingModerationRepository;

	constructor(private readonly db: PrismaClient) {
		this.delegate = new PrismaListingModerationRepository(db);
	}

	async findListingForModeration(listingId: string) {
		return this.delegate.findListingForModeration(listingId);
	}

	async saveListingStatus(
		listingId: string,
		status: ListingModerationResult["status"],
		expectedStatus: ListingModerationResult["status"],
	) {
		await this.db.listing.update({
			where: { id: listingId },
			data: {
				isApproved: true,
				listingStatus: "APPROVED",
			},
		});

		return this.delegate.saveListingStatus(listingId, status, expectedStatus);
	}
}

class FailingListingModerationNotifier
	implements ListingModerationNotifierPort
{
	async notifyListingApproved(
		_listing: ListingModerationResult,
		_event: ListingApprovedEvent,
	): Promise<void> {
		throw new Error("Notification write failed");
	}

	async notifyListingDeclined(
		_listing: ListingModerationResult,
		_event: ListingDeclinedEvent,
	): Promise<void> {
		throw new Error("Notification write failed");
	}
}

function sellerUser(id = "seller-1"): ServerUserContext {
	return {
		id,
		email: `${id}@example.com`,
		firstName: "A",
		lastName: "Seller",
		role: "SELLER",
	};
}

function adminUser(): ServerUserContext {
	return {
		id: "admin-1",
		email: "admin@example.com",
		firstName: "Admin",
		lastName: "User",
		role: "ADMIN",
	};
}

function imageFile(name: string) {
	return new File([`bytes-${name}`], name, { type: "image/jpeg" });
}

async function seedSellerOrderItemReference(
	db: PrismaClient,
	listingId: string,
) {
	await seedPurchaseWithSellerOrders(db, {
		id: "purchase-1",
		purchaseNumber: "RM-REFERENCE-1",
		totalAmountCents: 19995,
		sellerOrders: [
			{
				id: "seller-order-1",
				sellerId: "seller-1",
				sellerIdSnapshot: "seller-1",
				subtotalCents: 19995,
				items: [
					{
						id: "seller-order-item-1",
						listingId,
						unitPriceCents: 19995,
						quantity: 1,
					},
				],
			},
		],
	});
}
