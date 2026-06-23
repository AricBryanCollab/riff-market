import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import type { ListingImageManagerPort } from "@/domains/listings/application/manage-listing";
import { PrismaListingCommandRepository } from "@/domains/listings/infrastructure/prisma-listing-commands";
import {
	PrismaListingModerationNotifier,
	PrismaListingModerationRepository,
} from "@/domains/listings/infrastructure/prisma-listing-moderation";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	createListingForCurrentUser,
	type ListingRequestError,
	moderateListingForCurrentUser,
	removeListingForCurrentUser,
	updateListingForCurrentUser,
	validateCreateListingFormData,
	validateUpdateListingFormData,
} from "@/server/listing-service";
import {
	describeDb,
	seedMarketplaceUsers,
	seedListing as seedProduct,
	seedPurchaseWithSellerOrders,
	setupPrismaTestDatabase,
} from "@/test/prisma-test-support";
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
		formData.append("price", "199.95");
		formData.append("stock", "3");
		formData.append("image", imageFile("listing.jpg"));

		const response = await createListingForCurrentUser(
			sellerUser(),
			validateCreateListingFormData(formData),
			commandDependencies(db, imageManager),
		);

		expect(response).toMatchObject({
			message: "New product has been added",
			product: {
				sellerId: "seller-1",
				name: "Smoke Telecaster",
				price: 199.95,
				priceCents: 19995,
				currencyCode: "USD",
				stock: 3,
				isApproved: false,
				listingStatus: "PENDING",
				images: ["https://cdn.example.com/upload-1.jpg"],
			},
		});
		expect(imageManager.uploadedFileNames).toEqual(["listing.jpg"]);

		const listing = await db.product.findUniqueOrThrow({
			where: { id: response.product.id },
		});
		expect(listing).toMatchObject({
			sellerId: "seller-1",
			name: "Smoke Telecaster",
			price: 199.95,
			priceCents: 19995,
			currencyCode: "USD",
			isApproved: false,
			listingStatus: "PENDING",
		});
	});

	it("updates seller listings back to pending and cleans up replaced images", async () => {
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			isApproved: true,
			listingStatus: "APPROVED",
		});
		const formData = new FormData();
		formData.append("listingId", "listing-1");
		formData.append("name", "Updated Telecaster");
		formData.append("price", "249.50");
		formData.append("image", imageFile("updated.jpg"));

		const response = await updateListingForCurrentUser(
			sellerUser(),
			validateUpdateListingFormData(formData),
			commandDependencies(db, imageManager),
		);

		expect(response.product).toMatchObject({
			id: "listing-1",
			name: "Updated Telecaster",
			price: 249.5,
			priceCents: 24950,
			isApproved: false,
			listingStatus: "PENDING",
			images: ["https://cdn.example.com/upload-1.jpg"],
		});
		expect(imageManager.cleanedImages).toEqual([
			{
				url: "https://cdn.example.com/listing-1.jpg",
				publicId: "listing-1",
			},
		]);

		const listing = await db.product.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			name: "Updated Telecaster",
			priceCents: 24950,
			isApproved: false,
			listingStatus: "PENDING",
		});
	});

	it("lets admins update listings without resetting approval", async () => {
		await seedProduct(db, {
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

		const listing = await db.product.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			name: "Admin Curated Telecaster",
			isApproved: true,
			listingStatus: "APPROVED",
		});
	});

	it("moderates listings and creates seller notifications", async () => {
		await seedProduct(db, {
			id: "listing-approve",
			sellerId: "seller-1",
			isApproved: false,
			listingStatus: "PENDING",
		});
		await seedProduct(db, {
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

		const approved = await db.product.findUniqueOrThrow({
			where: { id: "listing-approve" },
		});
		const declined = await db.product.findUniqueOrThrow({
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
			"Great News! Your product Telecaster has been approved and live at the RiffMarket shop",
			"Your product Declined Telecaster has been declined by the admin",
		]);
	});

	it("hard-deletes unreferenced listings and cleans up images", async () => {
		await seedProduct(db, {
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

		expect(response.product).toEqual({
			listingId: "listing-1",
			mode: "DELETED",
			message: "Product deleted successfully",
		});
		await expect(
			db.product.findUnique({ where: { id: "listing-1" } }),
		).resolves.toBeNull();
		expect(imageManager.cleanedImages).toEqual([
			{
				url: "https://cdn.example.com/listing-1.jpg",
				publicId: "listing-1",
			},
		]);
	});

	it("withdraws referenced listings instead of deleting them", async () => {
		await seedProduct(db, {
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

		expect(response.product).toEqual({
			listingId: "listing-1",
			mode: "WITHDRAWN",
			message: "Product withdrawn successfully",
		});

		const listing = await db.product.findUniqueOrThrow({
			where: { id: "listing-1" },
		});
		expect(listing).toMatchObject({
			isApproved: false,
			listingStatus: "WITHDRAWN",
		});
		expect(imageManager.cleanedImages).toEqual([]);
	});

	it("blocks sellers from mutating another seller's listing", async () => {
		await seedProduct(db, {
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
			name: "ListingRequestError",
			status: 403,
			code: "LISTING_COMMAND_UNAUTHORIZED",
		} satisfies Partial<ListingRequestError>);

		const listing = await db.product.findUniqueOrThrow({
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

	async cleanupImagesBestEffort(images: ImageAssetRef[]): Promise<void> {
		this.cleanedImages.push(...images);
	}
}

function commandDependencies(
	db: PrismaClient,
	imageManager: ListingImageManagerPort,
) {
	return {
		repository: new PrismaListingCommandRepository(db),
		imageManager,
	};
}

function moderationDependencies(db: PrismaClient) {
	return {
		repository: new PrismaListingModerationRepository(db),
		notifier: new PrismaListingModerationNotifier(db),
	};
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
