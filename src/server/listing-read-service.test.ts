import { describe, expect, it } from "vitest";
import type {
	ListingReadModel,
	ListingReadStatus,
} from "@/domains/listings/dto/listing-read-model";
import {
	getApprovedListingsForProductApi,
	getListingDetailsProductResponse,
	type ListingReadServiceDependencies,
} from "./listing-read-service";

describe("listing read service", () => {
	it("returns missing listing detail as a product API 404 response", async () => {
		const dependencies: ListingReadServiceDependencies = {
			listings: {
				findById: async () => null,
				searchApproved: async () => [],
				listForSeller: async () => [],
				listPendingModeration: async () => [],
				countApprovedByCategory: async () => [],
				countByStatus: async () => 0,
				listRecentApproved: async () => [],
				findByIds: async () => [],
			},
		};

		const response = await getListingDetailsProductResponse(
			"missing",
			dependencies,
		);

		await expect(response.json()).resolves.toEqual({
			message: "Product not found",
		});
		expect(response.status).toBe(404);
		expect(response.ok).toBe(false);
	});

	it("returns listing detail as a product API success response", async () => {
		const listing = makeListingReadModel();
		const dependencies: ListingReadServiceDependencies = {
			listings: {
				findById: async (listingId) =>
					listingId === "listing-1" ? listing : null,
				searchApproved: async () => [],
				listForSeller: async () => [],
				listPendingModeration: async () => [],
				countApprovedByCategory: async () => [],
				countByStatus: async () => 0,
				listRecentApproved: async () => [],
				findByIds: async () => [],
			},
		};

		const response = await getListingDetailsProductResponse(
			"listing-1",
			dependencies,
		);

		await expect(response.json()).resolves.toEqual({
			...listing,
			isApproved: true,
			createdAt: listing.createdAt.toISOString(),
			updatedAt: listing.updatedAt.toISOString(),
		});
		expect(response.status).toBe(200);
		expect(response.ok).toBe(true);
	});

	it.each([
		["PENDING" as const],
		["DECLINED" as const],
		["WITHDRAWN" as const],
	])("returns %s listing detail as a product API 404 response", async (listingStatus) => {
		const listing = makeListingReadModel({ listingStatus });
		const dependencies: ListingReadServiceDependencies = {
			listings: {
				findById: async () => listing,
				searchApproved: async () => [],
				listForSeller: async () => [],
				listPendingModeration: async () => [],
				countApprovedByCategory: async () => [],
				countByStatus: async () => 0,
				listRecentApproved: async () => [],
				findByIds: async () => [],
			},
		};

		const response = await getListingDetailsProductResponse(
			"listing-1",
			dependencies,
		);

		await expect(response.json()).resolves.toEqual({
			message: "Product not found",
		});
		expect(response.status).toBe(404);
		expect(response.ok).toBe(false);
	});

	it("uses approved product API query params when searching listings", async () => {
		const listing = makeListingReadModel();
		let receivedQuery:
			| Parameters<
					ListingReadServiceDependencies["listings"]["searchApproved"]
			  >[0]
			| undefined;
		const dependencies: ListingReadServiceDependencies = {
			listings: {
				findById: async () => null,
				searchApproved: async (query) => {
					receivedQuery = query;
					return [listing];
				},
				listForSeller: async () => [],
				listPendingModeration: async () => [],
				countApprovedByCategory: async () => [],
				countByStatus: async () => 0,
				listRecentApproved: async () => [],
				findByIds: async () => [],
			},
		};

		const result = await getApprovedListingsForProductApi(
			{
				limit: "5",
				offset: "10",
				random: "true",
				category: "ELECTRIC",
				condition: "USED",
				brand: "Fender",
				search: "tele",
				priceMin: "199.95",
				priceMax: "500",
			},
			dependencies,
		);

		expect(result).toEqual([{ ...listing, isApproved: true }]);
		expect(receivedQuery).toEqual({
			limit: 5,
			offset: 10,
			random: true,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			search: "tele",
			priceMinCents: 19995,
			priceMaxCents: 50000,
		});
	});

	it("rejects invalid approved product API pagination before listing search", async () => {
		const dependencies: ListingReadServiceDependencies = {
			listings: {
				findById: async () => null,
				searchApproved: async () => {
					throw new Error("Invalid query should not search listings");
				},
				listForSeller: async () => [],
				listPendingModeration: async () => [],
				countApprovedByCategory: async () => [],
				countByStatus: async () => 0,
				listRecentApproved: async () => [],
				findByIds: async () => [],
			},
		};

		const result = await getApprovedListingsForProductApi(
			{
				limit: "0",
				offset: "0",
				random: null,
				category: null,
				condition: null,
				brand: null,
				search: null,
				priceMin: undefined,
				priceMax: undefined,
			},
			dependencies,
		);

		expect(result).toMatchObject({
			error: "Invalid product queries",
			details: expect.any(Object),
		});
	});

	it("rejects invalid listing filters before listing search", async () => {
		const dependencies: ListingReadServiceDependencies = {
			listings: {
				findById: async () => null,
				searchApproved: async () => {
					throw new Error("Invalid filters should not search listings");
				},
				listForSeller: async () => [],
				listPendingModeration: async () => [],
				countApprovedByCategory: async () => [],
				countByStatus: async () => 0,
				listRecentApproved: async () => [],
				findByIds: async () => [],
			},
		};

		const result = await getApprovedListingsForProductApi(
			{
				limit: "5",
				offset: "0",
				random: "false",
				category: "DRUMS",
				condition: "BROKEN",
				brand: null,
				search: null,
				priceMin: undefined,
				priceMax: undefined,
			},
			dependencies,
		);

		expect(result).toMatchObject({
			error: "Invalid product queries",
			details: expect.any(Object),
		});
	});
});

function makeListingReadModel({
	listingStatus = "APPROVED",
}: {
	listingStatus?: ListingReadStatus;
} = {}): ListingReadModel & {
	createdAt: Date;
	updatedAt: Date;
} {
	return {
		id: "listing-1",
		sellerId: "seller-1",
		name: "Telecaster",
		category: "ELECTRIC",
		condition: "USED",
		brand: "Fender",
		model: "American Standard",
		images: ["https://cdn.example.com/telecaster.jpg"],
		description: "A test guitar",
		price: 400,
		priceCents: 40000,
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
