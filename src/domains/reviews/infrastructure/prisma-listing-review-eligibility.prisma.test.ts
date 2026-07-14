import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import {
	describeDb,
	seedListing,
	seedMarketplaceUsers,
	seedPurchaseWithSellerOrders,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";
import { PrismaListingReviewEligibility } from "./prisma-listing-review-eligibility";

describeDb("Prisma listing review eligibility", () => {
	let db: PrismaClient;
	let eligibility: PrismaListingReviewEligibility;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		eligibility = new PrismaListingReviewEligibility(db);
		await seedMarketplaceUsers(db, [
			{
				id: "customer-1",
				email: "customer@example.com",
				firstName: "Pat",
				lastName: "Buyer",
				role: "CUSTOMER",
			},
			{
				id: "customer-2",
				email: "customer-2@example.com",
				firstName: "Sam",
				lastName: "Shopper",
				role: "CUSTOMER",
			},
			{
				id: "seller-1",
				email: "seller-1@example.com",
				firstName: "A",
				lastName: "Seller",
				role: "SELLER",
			},
		]);
		await seedListing(db, { id: "listing-1" });
	});

	it("returns true when the customer has a delivered seller order for the listing", async () => {
		await seedPurchaseWithSellerOrders(db, {
			totalAmountCents: 125,
			sellerOrders: [
				{
					id: "seller-order-1",
					subtotalCents: 125,
					status: "DELIVERED",
					items: [
						{
							id: "seller-order-item-1",
							listingId: "listing-1",
							unitPriceCents: 125,
							quantity: 1,
						},
					],
				},
			],
		});

		await expect(
			eligibility.hasDeliveredPurchaseOfListing("customer-1", "listing-1"),
		).resolves.toBe(true);
	});

	it("returns false when the seller order for the listing is not delivered", async () => {
		await seedPurchaseWithSellerOrders(db, {
			totalAmountCents: 125,
			sellerOrders: [
				{
					id: "seller-order-1",
					subtotalCents: 125,
					status: "SHIPPED",
					trackingNumber: "TRACK-1",
					items: [
						{
							id: "seller-order-item-1",
							listingId: "listing-1",
							unitPriceCents: 125,
							quantity: 1,
						},
					],
				},
			],
		});

		await expect(
			eligibility.hasDeliveredPurchaseOfListing("customer-1", "listing-1"),
		).resolves.toBe(false);
	});

	it("returns false when a delivered seller order is for a different listing", async () => {
		await seedListing(db, { id: "listing-2", name: "Jazzmaster" });
		await seedPurchaseWithSellerOrders(db, {
			totalAmountCents: 125,
			sellerOrders: [
				{
					id: "seller-order-1",
					subtotalCents: 125,
					status: "DELIVERED",
					items: [
						{
							id: "seller-order-item-1",
							listingId: "listing-2",
							listingName: "Jazzmaster",
							unitPriceCents: 125,
							quantity: 1,
						},
					],
				},
			],
		});

		await expect(
			eligibility.hasDeliveredPurchaseOfListing("customer-1", "listing-1"),
		).resolves.toBe(false);
	});

	it("returns false when a delivered seller order belongs to a different customer", async () => {
		await seedPurchaseWithSellerOrders(db, {
			totalAmountCents: 125,
			sellerOrders: [
				{
					id: "seller-order-1",
					subtotalCents: 125,
					status: "DELIVERED",
					items: [
						{
							id: "seller-order-item-1",
							listingId: "listing-1",
							unitPriceCents: 125,
							quantity: 1,
						},
					],
				},
			],
		});

		await expect(
			eligibility.hasDeliveredPurchaseOfListing("customer-2", "listing-1"),
		).resolves.toBe(false);
	});
});
