import { describe, expect, it, vi } from "vitest";
import { Money } from "@/domains/shared/domain/money";
import type { ImageAssetRef } from "@/types/image-asset";
import {
	createListing,
	type ListingCommandDependencies,
	type ListingCommandRepositoryPort,
	type ListingImageManagerPort,
	type ListingMutationResult,
	type ListingRemovalSnapshot,
	removeListing,
	updateListing,
} from "./manage-listing";

const sellerActor = { id: "seller-1", role: "SELLER" as const };
const adminActor = { id: "admin-1", role: "ADMIN" as const };
const customerActor = { id: "customer-1", role: "CUSTOMER" as const };

function image(url: string): ImageAssetRef {
	return {
		url,
		publicId:
			url
				.split("/")
				.pop()
				?.replace(/\.[^.]+$/, "") ?? url,
	};
}

function imageFile(name: string) {
	return new File([`bytes-${name}`], name, { type: "image/jpeg" });
}

function makeMutationResult(
	overrides: Partial<ListingMutationResult> = {},
): ListingMutationResult {
	return {
		id: "listing-1",
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "NEW",
		brand: "Fender",
		model: "Player",
		images: [image("https://cdn.example.com/current.jpg")],
		description: "A listing",
		priceAmountMinor: 19995,
		currencyCode: "TWD",
		stock: 2,
		isApproved: false,
		listingStatus: "PENDING",
		...overrides,
	};
}

function makeRemovalSnapshot(
	overrides: Partial<ListingRemovalSnapshot> = {},
): ListingRemovalSnapshot {
	return {
		id: "listing-1",
		sellerId: "seller-1",
		sellerDisplayName: "A Seller",
		name: "Telecaster",
		brand: "Fender",
		model: "Player",
		category: "ELECTRIC",
		condition: "NEW",
		primaryImageUrl: "https://cdn.example.com/current.jpg",
		price: Money.fromMinor(19995, "TWD"),
		stock: 2,
		status: "APPROVED",
		images: [image("https://cdn.example.com/current.jpg")],
		referenceCounts: {
			sellerOrderItems: 0,
			reviews: 0,
			favorites: 0,
		},
		...overrides,
	};
}

function createFakes() {
	const repository: ListingCommandRepositoryPort = {
		createListing: vi.fn(async () => makeMutationResult()),
		findListingForMutation: vi.fn(async () => makeRemovalSnapshot()),
		updateListing: vi.fn(async (_id, input) =>
			makeMutationResult({
				isApproved: input.isApproved,
				listingStatus: input.status,
				images: input.images ?? [image("https://cdn.example.com/current.jpg")],
			}),
		),
		deleteListing: vi.fn(async () => true),
		saveListingStatus: vi.fn(async (_id, status) =>
			makeMutationResult({
				isApproved: status === "APPROVED",
				listingStatus: status,
			}),
		),
	};
	const images: ListingImageManagerPort = {
		uploadImages: vi.fn(async () => [image("https://cdn.example.com/new.jpg")]),
		cleanupUploadedImagesBestEffort: vi.fn(async () => undefined),
		cleanupPersistedImagesBestEffort: vi.fn(async () => undefined),
	};
	const dependencies: ListingCommandDependencies = {
		listings: repository,
		images,
	};

	return { repository, images, dependencies };
}

describe("listing command use cases", () => {
	it("creates seller listings as pending with minor-amount price persistence", async () => {
		const { repository, images, dependencies } = createFakes();

		const result = await createListing(
			sellerActor,
			{
				name: "Telecaster",
				category: "ELECTRIC",
				condition: "NEW",
				brand: " Fender   Custom ",
				model: "Player",
				description: "A listing",
				price: 19995,
				stock: 2,
				imageFiles: [imageFile("listing.jpg")],
			},
			dependencies,
		);

		expect(result.ok).toBe(true);
		expect(images.uploadImages).toHaveBeenCalledTimes(1);
		expect(repository.createListing).toHaveBeenCalledWith(
			expect.objectContaining({
				sellerId: "seller-1",
				status: "PENDING",
				isApproved: false,
				brand: "Fender Custom",
				priceAmountMinor: 19995,
				currencyCode: "TWD",
				images: [image("https://cdn.example.com/new.jpg")],
			}),
		);
	});

	it("blocks customers from creating listings before uploading images", async () => {
		const { repository, images, dependencies } = createFakes();

		const result = await createListing(
			customerActor,
			{
				name: "Telecaster",
				category: "ELECTRIC",
				condition: "NEW",
				brand: "Fender",
				model: "Player",
				description: "A listing",
				price: 19995,
				stock: 2,
				imageFiles: [imageFile("listing.jpg")],
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "LISTING_COMMAND_UNAUTHORIZED" },
		});
		expect(images.uploadImages).not.toHaveBeenCalled();
		expect(repository.createListing).not.toHaveBeenCalled();
	});

	it("rejects zero-stock listings before uploading images", async () => {
		const { repository, images, dependencies } = createFakes();

		const result = await createListing(
			sellerActor,
			{
				name: "Telecaster",
				category: "ELECTRIC",
				condition: "NEW",
				brand: "Fender",
				model: "Player",
				description: "A listing",
				price: 19995,
				stock: 0,
				imageFiles: [imageFile("listing.jpg")],
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "LISTING_COMMAND_INVALID_STOCK",
				kind: "validation",
			},
		});
		expect(images.uploadImages).not.toHaveBeenCalled();
		expect(repository.createListing).not.toHaveBeenCalled();
	});

	it("cleans up uploaded create images when persistence does not save", async () => {
		const { repository, images, dependencies } = createFakes();
		vi.mocked(repository.createListing).mockResolvedValue(null);

		const result = await createListing(
			sellerActor,
			{
				name: "Telecaster",
				category: "ELECTRIC",
				condition: "NEW",
				brand: "Fender",
				model: "Player",
				description: "A listing",
				price: 19995,
				stock: 2,
				imageFiles: [imageFile("listing.jpg")],
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "LISTING_COMMAND_SAVE_FAILED" },
		});
		expect(images.cleanupUploadedImagesBestEffort).toHaveBeenCalledWith([
			image("https://cdn.example.com/new.jpg"),
		]);
	});

	it("updates seller listings back to pending and cleans up replaced images after save", async () => {
		const { repository, images, dependencies } = createFakes();

		const result = await updateListing(
			sellerActor,
			{
				listingId: "listing-1",
				name: "Updated",
				brand: " Fender   Offset ",
				imageFiles: [imageFile("new.jpg")],
			},
			dependencies,
		);

		expect(result.ok).toBe(true);
		expect(repository.updateListing).toHaveBeenCalledWith(
			"listing-1",
			expect.objectContaining({
				name: "Updated",
				brand: "Fender Offset",
				status: "PENDING",
				isApproved: false,
				images: [image("https://cdn.example.com/new.jpg")],
			}),
		);
		expect(images.cleanupPersistedImagesBestEffort).toHaveBeenCalledWith(
			[image("https://cdn.example.com/current.jpg")],
			{
				listingId: "listing-1",
				sellerId: "seller-1",
			},
		);
	});

	it("saves image removal and reordering", async () => {
		const { repository, images, dependencies } = createFakes();
		const first = image("https://cdn.example.com/first.jpg");
		const second = image("https://cdn.example.com/second.jpg");
		const removed = image("https://cdn.example.com/remove.jpg");
		const uploaded = image("https://cdn.example.com/new.jpg");

		vi.mocked(repository.findListingForMutation).mockResolvedValue(
			makeRemovalSnapshot({
				images: [first, second, removed],
			}),
		);

		const result = await updateListing(
			sellerActor,
			{
				listingId: "listing-1",
				imageUpdate: {
					items: [
						{ kind: "existing", imageId: second.publicId },
						{ kind: "new", index: 0 },
						{ kind: "existing", imageId: first.publicId },
					],
				},
				imageFiles: [imageFile("new.jpg")],
			},
			dependencies,
		);

		expect(result.ok).toBe(true);
		expect(repository.updateListing).toHaveBeenCalledWith(
			"listing-1",
			expect.objectContaining({
				images: [second, uploaded, first],
			}),
		);
		expect(images.cleanupPersistedImagesBestEffort).toHaveBeenCalledWith(
			[removed],
			{
				listingId: "listing-1",
				sellerId: "seller-1",
			},
		);
	});

	it("rejects listing updates that would remove every image", async () => {
		const { repository, images, dependencies } = createFakes();

		const result = await updateListing(
			sellerActor,
			{
				listingId: "listing-1",
				imageUpdate: { items: [] },
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "LISTING_COMMAND_INVALID_IMAGES",
				message: "Listing must keep at least one image",
			},
		});
		expect(repository.updateListing).not.toHaveBeenCalled();
		expect(images.cleanupPersistedImagesBestEffort).not.toHaveBeenCalled();
	});

	it("cleans up uploaded replacement images when update persistence does not save", async () => {
		const { repository, images, dependencies } = createFakes();
		vi.mocked(repository.updateListing).mockResolvedValue(null);

		const result = await updateListing(
			sellerActor,
			{
				listingId: "listing-1",
				imageFiles: [imageFile("new.jpg")],
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "LISTING_COMMAND_SAVE_FAILED" },
		});
		expect(images.cleanupUploadedImagesBestEffort).toHaveBeenCalledWith([
			image("https://cdn.example.com/new.jpg"),
		]);
		expect(images.cleanupPersistedImagesBestEffort).not.toHaveBeenCalled();
	});

	it("auto-approves admin listing updates", async () => {
		const { repository, images, dependencies } = createFakes();

		await updateListing(
			adminActor,
			{
				listingId: "listing-1",
				name: "Admin update",
			},
			dependencies,
		);

		expect(repository.updateListing).toHaveBeenCalledWith(
			"listing-1",
			expect.objectContaining({
				status: "APPROVED",
				isApproved: true,
			}),
		);
		expect(images.uploadImages).not.toHaveBeenCalled();
	});

	it("blocks seller updates for listings they do not own", async () => {
		const { repository, dependencies } = createFakes();
		vi.mocked(repository.findListingForMutation).mockResolvedValue(
			makeRemovalSnapshot({ sellerId: "seller-2" }),
		);

		const result = await updateListing(
			sellerActor,
			{
				listingId: "listing-1",
				name: "Blocked",
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "LISTING_COMMAND_UNAUTHORIZED" },
		});
		expect(repository.updateListing).not.toHaveBeenCalled();
	});

	it("hard-deletes unreferenced listings and cleans up images", async () => {
		const { repository, images, dependencies } = createFakes();

		const result = await removeListing(
			sellerActor,
			{ listingId: "listing-1" },
			dependencies,
		);

		expect(result).toEqual({
			ok: true,
			value: {
				listingId: "listing-1",
				mode: "DELETED",
				message: "Listing deleted successfully",
			},
		});
		expect(repository.deleteListing).toHaveBeenCalledWith("listing-1");
		expect(repository.saveListingStatus).not.toHaveBeenCalled();
		expect(images.cleanupPersistedImagesBestEffort).toHaveBeenCalledWith(
			[image("https://cdn.example.com/current.jpg")],
			{
				listingId: "listing-1",
				sellerId: "seller-1",
			},
		);
	});

	it("withdraws referenced listings instead of deleting or cleaning images", async () => {
		const { repository, images, dependencies } = createFakes();
		vi.mocked(repository.findListingForMutation).mockResolvedValue(
			makeRemovalSnapshot({
				referenceCounts: {
					sellerOrderItems: 1,
					reviews: 0,
					favorites: 0,
				},
			}),
		);

		const result = await removeListing(
			sellerActor,
			{ listingId: "listing-1" },
			dependencies,
		);

		expect(result).toEqual({
			ok: true,
			value: {
				listingId: "listing-1",
				mode: "WITHDRAWN",
				message: "Listing withdrawn successfully",
			},
		});
		expect(repository.deleteListing).not.toHaveBeenCalled();
		expect(repository.saveListingStatus).toHaveBeenCalledWith(
			"listing-1",
			"WITHDRAWN",
		);
		expect(images.cleanupPersistedImagesBestEffort).not.toHaveBeenCalled();
		expect(images.cleanupUploadedImagesBestEffort).not.toHaveBeenCalled();
	});

	it("rejects withdrawing an already withdrawn referenced listing", async () => {
		const { repository, dependencies } = createFakes();
		vi.mocked(repository.findListingForMutation).mockResolvedValue(
			makeRemovalSnapshot({
				status: "WITHDRAWN",
				referenceCounts: {
					sellerOrderItems: 1,
					reviews: 0,
					favorites: 0,
				},
			}),
		);

		const result = await removeListing(
			sellerActor,
			{ listingId: "listing-1" },
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: { code: "LISTING_COMMAND_INVALID_TRANSITION" },
		});
		expect(repository.deleteListing).not.toHaveBeenCalled();
		expect(repository.saveListingStatus).not.toHaveBeenCalled();
	});

	it("returns image upload failures before saving updates", async () => {
		const { repository, images, dependencies } = createFakes();
		vi.mocked(images.uploadImages).mockRejectedValue(
			new Error("upload failed"),
		);

		const result = await updateListing(
			sellerActor,
			{
				listingId: "listing-1",
				imageFiles: [imageFile("new.jpg")],
			},
			dependencies,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "LISTING_COMMAND_IMAGE_UPLOAD_FAILED",
				details: "upload failed",
			},
		});
		expect(repository.updateListing).not.toHaveBeenCalled();
	});
});
