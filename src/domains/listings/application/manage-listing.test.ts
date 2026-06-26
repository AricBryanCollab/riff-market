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
		price: 199.95,
		priceCents: 19995,
		currencyCode: "USD",
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
		price: Money.fromCents(19995, "USD"),
		stock: 2,
		status: "APPROVED",
		images: [image("https://cdn.example.com/current.jpg")],
		referenceCounts: {
			legacyOrderItems: 0,
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
	it("creates seller listings as pending and dual-writes product money", async () => {
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
				price: 199.95,
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
				price: 199.95,
				priceCents: 19995,
				currencyCode: "USD",
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
				price: 199.95,
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
				price: 199.95,
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
				imageFiles: [imageFile("new.jpg")],
			},
			dependencies,
		);

		expect(result.ok).toBe(true);
		expect(repository.updateListing).toHaveBeenCalledWith(
			"listing-1",
			expect.objectContaining({
				name: "Updated",
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
				message: "Product deleted successfully",
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
					legacyOrderItems: 0,
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
				message: "Product withdrawn successfully",
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
					legacyOrderItems: 0,
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
