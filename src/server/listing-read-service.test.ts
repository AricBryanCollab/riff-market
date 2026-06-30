import { describe, expect, it } from "vitest";
import type {
	ListingReadModel,
	ListingReadStatus,
} from "@/domains/listings/dto/listing-read-model";
import {
	getApprovedListingsForProductApi,
	getListingDetailsForProductApi,
	type ListingReadServiceDependencies,
} from "./listing-read-service";

describe("listing read product behavior", () => {
	it("hides missing and non-public product details", async () => {
		const dependencies = makeDependencies([
			makeListing({ id: "pending-listing", listingStatus: "PENDING" }),
			makeListing({ id: "declined-listing", listingStatus: "DECLINED" }),
			makeListing({ id: "withdrawn-listing", listingStatus: "WITHDRAWN" }),
		]);

		await expect(
			getListingDetailsForProductApi("missing-listing", dependencies),
		).resolves.toEqual({ error: "Listing not found" });
		await expect(
			getListingDetailsForProductApi("pending-listing", dependencies),
		).resolves.toEqual({ error: "Listing not found" });
		await expect(
			getListingDetailsForProductApi("declined-listing", dependencies),
		).resolves.toEqual({ error: "Listing not found" });
		await expect(
			getListingDetailsForProductApi("withdrawn-listing", dependencies),
		).resolves.toEqual({ error: "Listing not found" });
	});

	it("searches approved listings from product filter input", async () => {
		const telecaster = makeListing({ id: "telecaster" });
		const dependencies = makeDependencies([telecaster]);

		const result = await getApprovedListingsForProductApi(
			{
				limit: "5",
				offset: "10",
				random: "false",
				category: "ELECTRIC",
				condition: "USED",
				brand: "Fender",
				search: "tele",
				priceMin: "199.95",
				priceMax: "500",
			},
			dependencies,
		);

		expect(result).toMatchObject([
			{
				id: "telecaster",
				name: "Telecaster",
				isApproved: true,
				listingStatus: "APPROVED",
				priceAmountMinor: 19995,
				priceCents: 19995,
				createdAt: "2026-06-18T00:00:00.000Z",
			},
		]);
	});
});

function makeDependencies(
	listings: ListingReadModel[],
): ListingReadServiceDependencies {
	return {
		listings: {
			findById: async (listingId) =>
				listings.find((listing) => listing.id === listingId) ?? null,
			searchApproved: async (query) =>
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
			listForSeller: async () => [],
			listPendingModeration: async () => [],
			countApprovedByCategory: async () => [],
			countByStatus: async () => 0,
			listRecentApproved: async () => [],
			findByIds: async () => [],
		},
	};
}

function makeListing({
	id = "listing-1",
	listingStatus = "APPROVED",
}: {
	readonly id?: string;
	readonly listingStatus?: ListingReadStatus;
} = {}): ListingReadModel {
	return {
		id,
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "USED",
		brand: "Fender",
		model: "American Standard",
		images: [`https://cdn.example.com/${id}.jpg`],
		description: "A test listing",
		price: 199.95,
		priceAmountMinor: 19995,
		priceCents: 19995,
		currencyCode: "USD",
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
