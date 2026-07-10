import { describe, expect, it } from "vitest";
import type { Actor } from "@/domains/shared/domain/actor";
import type { ListingView, ListingViewStatus } from "../dto/listing-view";
import {
	type CartListingQueryPort,
	toListingViewerCapabilities,
	getListingDetails,
	type ListingDetailQueryPort,
	listCartListings,
	listPendingModerationListings,
	listSellerListings,
	type PendingModerationListingQueryPort,
	type SellerListingQueryPort,
} from "./listing-queries";

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

describe("toListingViewerCapabilities", () => {
	it.each([
		[
			"admin viewing a pending listing",
			admin,
			"seller-2",
			"PENDING",
			{
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: true,
				viewerCanDecline: true,
			},
		],
		[
			"admin viewing an approved listing",
			admin,
			"seller-2",
			"APPROVED",
			{
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: false,
				viewerCanDecline: true,
			},
		],
		[
			"admin viewing a declined listing",
			admin,
			"seller-2",
			"DECLINED",
			{
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: true,
				viewerCanDecline: false,
			},
		],
		[
			"admin viewing a withdrawn listing",
			admin,
			"seller-2",
			"WITHDRAWN",
			{
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: false,
				viewerCanDecline: false,
			},
		],
		[
			"owning seller viewing their listing",
			seller,
			"seller-1",
			"PENDING",
			{
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: false,
				viewerCanDecline: false,
			},
		],
		[
			"another seller viewing a listing",
			seller,
			"seller-2",
			"PENDING",
			{
				viewerCanEdit: false,
				viewerCanDelete: false,
				viewerCanApprove: false,
				viewerCanDecline: false,
			},
		],
		[
			"customer viewing a listing",
			customer,
			"seller-1",
			"PENDING",
			{
				viewerCanEdit: false,
				viewerCanDelete: false,
				viewerCanApprove: false,
				viewerCanDecline: false,
			},
		],
		[
			"guest viewing a listing",
			null,
			"seller-1",
			"PENDING",
			{
				viewerCanEdit: false,
				viewerCanDelete: false,
				viewerCanApprove: false,
				viewerCanDecline: false,
			},
		],
	] as const)("derives capabilities for %s", (_label, actor, sellerId, listingStatus, expected) => {
		expect(
			toListingViewerCapabilities({
				viewer: actor,
				sellerId,
				listingStatus,
			}),
		).toEqual(expected);
	});
});

describe("getListingDetails", () => {
	it.each(
		actors,
	)("allows %s to read approved listing details", async (_label, actor) => {
		const listing = makeListing({ listingStatus: "APPROVED" });

		await expect(readListingDetails(actor, listing)).resolves.toEqual({
			ok: true,
			value: {
				...listing,
				...toListingViewerCapabilities({
					viewer: actor,
					sellerId: listing.sellerId,
					listingStatus: listing.listingStatus,
				}),
			},
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
				code: "LISTING_QUERY_NOT_FOUND",
				kind: "not-found",
				message: "Listing not found",
			},
		});
	});

	it("allows admins to read pending listing details with capabilities", async () => {
		const listing = makeListing({ listingStatus: "PENDING" });

		await expect(readListingDetails(admin, listing)).resolves.toEqual({
			ok: true,
			value: {
				...listing,
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: true,
				viewerCanDecline: true,
			},
		});
	});

	it("attaches seller capabilities on owned approved listings", async () => {
		const listing = makeListing({ listingStatus: "APPROVED" });

		await expect(readListingDetails(seller, listing)).resolves.toEqual({
			ok: true,
			value: {
				...listing,
				viewerCanEdit: true,
				viewerCanDelete: true,
				viewerCanApprove: false,
				viewerCanDecline: false,
			},
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
					code: "LISTING_QUERY_NOT_FOUND",
					kind: "not-found",
					message: "Listing not found",
				},
			});
		}
	});
});

describe("listSellerListings", () => {
	it("allows sellers to query their own listings", async () => {
		const listing = makeListing();
		const listings = makeSellerListingPort([listing]);

		await expect(listSellerListings(seller, listings)).resolves.toEqual({
			ok: true,
			value: [listing],
		});
	});

	it.each([
		["admin", admin],
		["customer", customer],
	] as const)("rejects %s actors", async (_label, actor) => {
		await expect(
			listSellerListings(actor, makeSellerListingPort([])),
		).resolves.toMatchObject({
			ok: false,
			error: {
				code: "LISTING_QUERY_UNAUTHORIZED",
				kind: "authorization",
			},
		});
	});
});

describe("listPendingModerationListings", () => {
	it("allows admins to query pending moderation listings", async () => {
		const listing = makeListing({ listingStatus: "PENDING" });
		const listings = makePendingModerationListingPort([listing]);

		await expect(
			listPendingModerationListings(admin, listings),
		).resolves.toEqual({
			ok: true,
			value: [listing],
		});
	});

	it.each([
		["customer", customer],
		["seller", seller],
	] as const)("rejects %s actors", async (_label, actor) => {
		await expect(
			listPendingModerationListings(
				actor,
				makePendingModerationListingPort([]),
			),
		).resolves.toMatchObject({
			ok: false,
			error: {
				code: "LISTING_QUERY_UNAUTHORIZED",
				kind: "authorization",
			},
		});
	});
});

describe("listCartListings", () => {
	it("allows customers to query cart listings", async () => {
		const listing = makeListing();
		const listings = makeCartListingPort([listing]);

		await expect(
			listCartListings(customer, [listing.id], listings),
		).resolves.toEqual({
			ok: true,
			value: [listing],
		});
	});

	it.each([
		["admin", admin],
		["seller", seller],
	] as const)("rejects %s actors", async (_label, actor) => {
		await expect(
			listCartListings(actor, ["listing-1"], makeCartListingPort([])),
		).resolves.toMatchObject({
			ok: false,
			error: {
				code: "LISTING_QUERY_UNAUTHORIZED",
				kind: "authorization",
			},
		});
	});
});

function readListingDetails(actor: Actor | null, listing: ListingView) {
	return getListingDetails(actor, listing.id, makeListings([listing]));
}

function makeListings(listings: ListingView[]): ListingDetailQueryPort {
	return {
		findById: async (listingId) =>
			listings.find((listing) => listing.id === listingId) ?? null,
	};
}

function makeSellerListingPort(
	listings: ListingView[],
): SellerListingQueryPort {
	return {
		listForSeller: async (sellerId) =>
			listings.filter((listing) => listing.sellerId === sellerId),
	};
}

function makePendingModerationListingPort(
	listings: ListingView[],
): PendingModerationListingQueryPort {
	return {
		listPendingModeration: async () =>
			listings.filter((listing) => listing.listingStatus === "PENDING"),
	};
}

function makeCartListingPort(listings: ListingView[]): CartListingQueryPort {
	return {
		findByIds: async (listingIds) =>
			listings.filter((listing) => listingIds.includes(listing.id)),
	};
}

function makeListing({
	id = "listing-1",
	listingStatus = "APPROVED",
}: {
	readonly id?: string;
	readonly listingStatus?: ListingViewStatus;
} = {}): ListingView {
	return {
		id,
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "USED",
		brand: "Fender",
		model: "American Standard",
		images: [
			{
				imageId: id,
				url: `https://cdn.example.com/${id}.jpg`,
			},
		],
		description: "A test listing",
		priceAmountMinor: 19995,
		currencyCode: "TWD",
		stock: 2,
		listingStatus,
		isOrderable: listingStatus === "APPROVED",
		createdAt: new Date("2026-06-18T00:00:00.000Z"),
		updatedAt: new Date("2026-06-18T00:00:00.000Z"),
		seller: {
			firstName: "A",
			lastName: "Seller",
			email: "seller@example.com",
		},
	};
}
