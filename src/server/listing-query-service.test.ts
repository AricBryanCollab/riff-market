import { describe, expect, it } from "vitest";
import type {
	ApprovedListingSearchPort,
	ListingDetailQueryPort,
} from "@/domains/listings/application/listing-queries";
import type {
	ListingView,
	ListingViewStatus,
} from "@/domains/listings/dto/listing-view";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	getListingDetailsResponse,
	getPopularListingBrandCountDtos,
	searchApprovedListingResponses,
} from "./listing-query-service";

describe("listing query behavior", () => {
	it("hides missing and non-public listing details", async () => {
		const listings = makeListingDetailPort([
			makeListing({ id: "pending-listing", listingStatus: "PENDING" }),
			makeListing({ id: "declined-listing", listingStatus: "DECLINED" }),
			makeListing({ id: "withdrawn-listing", listingStatus: "WITHDRAWN" }),
		]);

		await expect(
			getListingDetailsResponse(null, "missing-listing", listings),
		).resolves.toEqual({ error: "Listing not found" });
		await expect(
			getListingDetailsResponse(null, "pending-listing", listings),
		).resolves.toEqual({ error: "Listing not found" });
		await expect(
			getListingDetailsResponse(null, "declined-listing", listings),
		).resolves.toEqual({ error: "Listing not found" });
		await expect(
			getListingDetailsResponse(null, "withdrawn-listing", listings),
		).resolves.toEqual({ error: "Listing not found" });
	});

	it("allows admins to read pending listing details for moderation", async () => {
		const pendingListing = makeListing({
			id: "pending-listing",
			listingStatus: "PENDING",
		});
		const listings = makeListingDetailPort([pendingListing]);

		await expect(
			getListingDetailsResponse(adminActor, "pending-listing", listings),
		).resolves.toMatchObject({
			id: "pending-listing",
			isApproved: false,
			listingStatus: "PENDING",
		});
	});

	it("searches approved listings from listing filter input", async () => {
		const telecaster = makeListing({ id: "telecaster" });
		const listings = makeApprovedListingSearchPort([telecaster]);

		const result = await searchApprovedListingResponses(
			null,
			{
				limit: "5",
				offset: "10",
				random: "false",
				category: "ELECTRIC",
				condition: "USED",
				brand: "Fender",
				search: "tele",
				priceMin: "19995",
				priceMax: "50000",
			},
			listings,
		);

		expect(result).toMatchObject([
			{
				id: "telecaster",
				name: "Telecaster",
				isApproved: true,
				listingStatus: "APPROVED",
				priceAmountMinor: 19995,
				currencyCode: "TWD",
				createdAt: "2026-06-18T00:00:00.000Z",
			},
		]);
	});

	it("returns popular approved brand counts from the listing query view", async () => {
		await expect(
			getPopularListingBrandCountDtos({
				listPopularApprovedBrandCounts: async () => [
					{ brand: "Fender", count: 2 },
				],
			}),
		).resolves.toEqual([{ brand: "Fender", count: 2 }]);
	});
});

const adminActor: Actor = {
	id: "admin-1",
	role: "ADMIN",
};

function makeListingDetailPort(
	listings: ListingView[],
): ListingDetailQueryPort {
	return {
		findById: async (listingId, _viewer) =>
			listings.find((listing) => listing.id === listingId) ?? null,
	};
}

function makeApprovedListingSearchPort(
	listings: ListingView[],
): ApprovedListingSearchPort {
	return {
		searchApproved: async (query, _viewer) =>
			query.limit === 5 &&
			query.offset === 10 &&
			query.random === false &&
			query.category === "ELECTRIC" &&
			query.condition === "USED" &&
			query.brand === "Fender" &&
			query.search === "tele" &&
			query.priceMinAmountMinor === 19995 &&
			query.priceMaxAmountMinor === 50000
				? listings.filter((listing) => listing.listingStatus === "APPROVED")
				: [],
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
		viewerCanEdit: false,
		viewerCanDelete: false,
		viewerCanApprove: false,
		viewerCanDecline: false,
		createdAt: new Date("2026-06-18T00:00:00.000Z"),
		updatedAt: new Date("2026-06-18T00:00:00.000Z"),
		seller: {
			firstName: "A",
			lastName: "Seller",
			email: "seller@example.com",
		},
	};
}
