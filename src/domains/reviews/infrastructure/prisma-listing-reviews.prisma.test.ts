import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import { createListingReview } from "@/domains/reviews/application/review-use-cases";
import {
	describeDb,
	seedListing,
	seedMarketplaceUsers,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";
import { PrismaListingReviews } from "./prisma-listing-reviews";

describeDb("Prisma listing reviews", () => {
	let db: PrismaClient;
	let reviews: PrismaListingReviews;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		reviews = new PrismaListingReviews(db);
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

	it("enforces one review per customer for a listing", async () => {
		const created = await createListingReview(
			{
				listingId: "listing-1",
				rating: 5,
				comment: "Exactly as described.",
			},
			{ id: "customer-1", role: "CUSTOMER" },
			reviews,
		);

		expect(created).toMatchObject({
			ok: true,
			value: {
				listingId: "listing-1",
				userId: "customer-1",
				rating: 5,
				comment: "Exactly as described.",
				reviewer: {
					firstName: "Pat",
					lastName: "Buyer",
				},
			},
		});

		const duplicate = await createListingReview(
			{
				listingId: "listing-1",
				rating: 4,
				comment: "Changed my mind.",
			},
			{ id: "customer-1", role: "CUSTOMER" },
			reviews,
		);

		expect(duplicate).toMatchObject({
			ok: false,
			error: {
				code: "REVIEW_ALREADY_EXISTS",
				kind: "conflict",
			},
		});
		await expect(
			db.review.count({ where: { listingId: "listing-1" } }),
		).resolves.toBe(1);
	});

	it("lists persisted listing reviews newest first with reviewer names", async () => {
		await db.review.create({
			data: {
				id: "older-review",
				listingId: "listing-1",
				userId: "customer-1",
				rating: 5,
				comment: "Exactly as described.",
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
				updatedAt: new Date("2026-01-01T00:00:00.000Z"),
			},
		});
		await db.review.create({
			data: {
				id: "newer-review",
				listingId: "listing-1",
				userId: "customer-2",
				rating: 4,
				comment: "Good communication.",
				createdAt: new Date("2026-01-02T00:00:00.000Z"),
				updatedAt: new Date("2026-01-02T00:00:00.000Z"),
			},
		});

		const listingReviews = await reviews.listByListingId("listing-1");

		expect(listingReviews).toMatchObject([
			{
				id: "newer-review",
				listingId: "listing-1",
				userId: "customer-2",
				rating: 4,
				comment: "Good communication.",
				reviewer: {
					firstName: "Sam",
					lastName: "Shopper",
				},
			},
			{
				id: "older-review",
				listingId: "listing-1",
				userId: "customer-1",
				rating: 5,
				comment: "Exactly as described.",
				reviewer: {
					firstName: "Pat",
					lastName: "Buyer",
				},
			},
		]);
	});
});
