import { describe, expect, it } from "vitest";
import type { Actor } from "@/domains/shared/domain/actor";
import type {
	ListingReadModel,
	ListingReadStatus,
} from "../dto/listing-read-model";
import {
	getListingDetails,
	type ListingDetailReadPort,
} from "./listing-read-models";

const admin: Actor = { id: "admin-1", role: "ADMIN" };
const seller: Actor = { id: "seller-1", role: "SELLER" };
const customer: Actor = { id: "customer-1", role: "CUSTOMER" };
const actors = [
	["guest", null],
	["admin", admin],
	["customer", customer],
	["seller", seller],
] as const;
const nonAdminActors = [
	["guest", null],
	["customer", customer],
	["seller", seller],
] as const;

describe("getListingDetails", () => {
	it.each(
		actors,
	)("allows %s to read approved listing details", async (_label, actor) => {
		const listing = makeListing({ listingStatus: "APPROVED" });

		await expect(readListingDetails(actor, listing)).resolves.toEqual({
			ok: true,
			value: listing,
		});
	});

	it.each(
		nonAdminActors,
	)("hides pending listing details from %s", async (_label, actor) => {
		await expect(
			readListingDetails(actor, makeListing({ listingStatus: "PENDING" })),
		).resolves.toMatchObject({
			ok: false,
			error: {
				code: "LISTING_READ_NOT_FOUND",
				kind: "not-found",
				message: "Listing not found",
			},
		});
	});

	it("allows admins to read pending listing details", async () => {
		const listing = makeListing({ listingStatus: "PENDING" });

		await expect(readListingDetails(admin, listing)).resolves.toEqual({
			ok: true,
			value: listing,
		});
	});

	it.each([
		"DECLINED",
		"WITHDRAWN",
	] as const)("hides %s listing details from every actor", async (listingStatus) => {
		for (const [_label, actor] of actors) {
			await expect(
				readListingDetails(actor, makeListing({ listingStatus })),
			).resolves.toMatchObject({
				ok: false,
				error: {
					code: "LISTING_READ_NOT_FOUND",
					kind: "not-found",
					message: "Listing not found",
				},
			});
		}
	});
});

function readListingDetails(actor: Actor | null, listing: ListingReadModel) {
	return getListingDetails(actor, listing.id, makeListings([listing]));
}

function makeListings(listings: ListingReadModel[]): ListingDetailReadPort {
	return {
		findById: async (listingId) =>
			listings.find((listing) => listing.id === listingId) ?? null,
	};
}

function makeListing({
	listingStatus = "APPROVED",
}: {
	readonly listingStatus?: ListingReadStatus;
} = {}): ListingReadModel {
	return {
		id: "listing-1",
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "USED",
		brand: "Fender",
		model: "American Standard",
		images: [
			{
				imageId: "image-1",
				url: "https://cdn.example.com/listing-1.jpg",
			},
		],
		description: "A test listing",
		priceAmountMinor: 19995,
		currencyCode: "TWD",
		stock: 2,
		listingStatus,
		createdAt: new Date("2026-06-18T00:00:00.000Z"),
		updatedAt: new Date("2026-06-18T00:00:00.000Z"),
		seller: {
			firstName: "A",
			lastName: "Seller",
			email: "seller@example.com",
		},
	};
}
