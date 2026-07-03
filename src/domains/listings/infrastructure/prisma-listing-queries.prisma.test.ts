import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import {
	describeDb,
	seedListing,
	seedMarketplaceUsers,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";
import { PrismaListingQueries } from "./prisma-listing-queries";

describeDb("Prisma listing read models", () => {
	let db: PrismaClient;
	let queries: PrismaListingQueries;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		queries = new PrismaListingQueries(db);
		await seedMarketplaceUsers(db, [
			{
				id: "seller-1",
				email: "seller@example.com",
				firstName: "A",
				lastName: "Seller",
				role: "SELLER",
			},
			{
				id: "seller-2",
				email: "seller-2@example.com",
				firstName: "B",
				lastName: "Seller",
				role: "SELLER",
			},
		]);
	});

	it("searches only approved listings through the listing read model", async () => {
		await seedListing(db, {
			id: "approved-1",
			name: "Approved Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedListing(db, {
			id: "approved-status-only",
			name: "Approved Status Only",
			listingStatus: "APPROVED",
			isApproved: false,
			createdAt: new Date("2026-06-18T02:00:00.000Z"),
		});
		await seedListing(db, {
			id: "legacy-flag-only",
			name: "Legacy Flag Only",
			listingStatus: "WITHDRAWN",
			isApproved: true,
			createdAt: new Date("2026-06-18T01:00:00.000Z"),
		});
		await seedListing(db, {
			id: "declined-1",
			name: "Declined Listing",
			listingStatus: "DECLINED",
			isApproved: false,
		});
		await seedListing(db, {
			id: "pending-1",
			name: "Pending Listing",
			listingStatus: "PENDING",
			isApproved: false,
		});

		const listings = await queries.searchApproved({
			limit: 10,
			offset: 0,
			random: false,
			priceMinAmountMinor: undefined,
			priceMaxAmountMinor: undefined,
		});

		expect(listings.map((listing) => listing.id)).toEqual([
			"approved-1",
			"approved-status-only",
		]);
		expect(listings[0]?.images).toEqual([
			{
				imageId: "approved-1",
				url: "https://cdn.example.com/approved-1.jpg",
			},
		]);
	});

	it("applies minor-amount price filters for approved listings", async () => {
		await seedListing(db, {
			id: "minor-priced",
			name: "Minor Priced",
			listingStatus: "APPROVED",
			isApproved: true,
			priceAmountMinor: 19995,
		});
		await seedListing(db, {
			id: "outside-range",
			name: "Outside Range",
			listingStatus: "APPROVED",
			isApproved: true,
			priceAmountMinor: 35000,
		});

		const listings = await queries.searchApproved({
			limit: 10,
			offset: 0,
			random: false,
			priceMinAmountMinor: 19995,
			priceMaxAmountMinor: 19995,
		});

		expect(listings.map((listing) => listing.id)).toEqual(["minor-priced"]);
	});

	it("applies category, condition, brand, and search filters to approved listings", async () => {
		await seedListing(db, {
			id: "matching-tele",
			name: "Road Worn Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			model: "Telecaster",
			description: "Bright twang guitar",
		});
		await seedListing(db, {
			id: "wrong-category",
			name: "Road Worn Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
			category: "ACOUSTIC",
			condition: "USED",
			brand: "Fender",
			model: "Telecaster",
			description: "Bright twang guitar",
		});
		await seedListing(db, {
			id: "wrong-condition",
			name: "Road Worn Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
			category: "ELECTRIC",
			condition: "NEW",
			brand: "Fender",
			model: "Telecaster",
			description: "Bright twang guitar",
		});
		await seedListing(db, {
			id: "wrong-brand",
			name: "Road Worn Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Gibson",
			model: "Telecaster",
			description: "Bright twang guitar",
		});
		await seedListing(db, {
			id: "wrong-search",
			name: "Offset Jazzmaster",
			listingStatus: "APPROVED",
			isApproved: true,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			model: "Jazzmaster",
			description: "Offset guitar",
		});
		await seedListing(db, {
			id: "pending-match",
			name: "Road Worn Telecaster",
			listingStatus: "PENDING",
			isApproved: false,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			model: "Telecaster",
			description: "Bright twang guitar",
		});

		const listings = await queries.searchApproved({
			limit: 10,
			offset: 0,
			random: false,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			search: "tele",
		});

		expect(listings.map((listing) => listing.id)).toEqual(["matching-tele"]);
	});

	it("reads listing details without applying public approval visibility", async () => {
		await seedListing(db, {
			id: "pending-detail",
			name: "Pending Detail",
			listingStatus: "PENDING",
			isApproved: false,
		});

		const listing = await queries.findById("pending-detail");

		expect(listing).toMatchObject({
			id: "pending-detail",
			listingStatus: "PENDING",
			images: [
				{
					imageId: "pending-detail",
					url: "https://cdn.example.com/pending-detail.jpg",
				},
			],
		});
	});

	it("returns a seller's listings newest first without other sellers' listings", async () => {
		await seedListing(db, {
			id: "seller-older",
			name: "Seller Older",
			listingStatus: "PENDING",
			isApproved: false,
			createdAt: new Date("2026-06-18T01:00:00.000Z"),
		});
		await seedListing(db, {
			id: "seller-newer",
			name: "Seller Newer",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedListing(db, {
			id: "other-seller",
			name: "Other Seller",
			sellerId: "seller-2",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T04:00:00.000Z"),
		});

		const listings = await queries.listForSeller("seller-1");

		expect(listings.map((listing) => listing.id)).toEqual([
			"seller-newer",
			"seller-older",
		]);
		expect(listings[0]).toMatchObject({
			id: "seller-newer",
			images: [
				{
					imageId: "seller-newer",
					url: "https://cdn.example.com/seller-newer.jpg",
				},
			],
		});
	});

	it("returns pending moderation listings newest first without final-status listings", async () => {
		await seedListing(db, {
			id: "pending-older",
			name: "Pending Older",
			listingStatus: "PENDING",
			isApproved: false,
			createdAt: new Date("2026-06-18T01:00:00.000Z"),
		});
		await seedListing(db, {
			id: "pending-newer",
			name: "Pending Newer",
			listingStatus: "PENDING",
			isApproved: false,
			createdAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedListing(db, {
			id: "declined-listing",
			name: "Declined Listing",
			listingStatus: "DECLINED",
			isApproved: false,
			createdAt: new Date("2026-06-18T04:00:00.000Z"),
		});
		await seedListing(db, {
			id: "withdrawn-listing",
			name: "Withdrawn Listing",
			listingStatus: "WITHDRAWN",
			isApproved: false,
			createdAt: new Date("2026-06-18T05:00:00.000Z"),
		});
		await seedListing(db, {
			id: "approved-listing",
			name: "Approved Listing",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T06:00:00.000Z"),
		});

		const listings = await queries.listPendingModeration();

		expect(listings.map((listing) => listing.id)).toEqual([
			"pending-newer",
			"pending-older",
		]);
		expect(listings[0]).toMatchObject({
			id: "pending-newer",
			listingStatus: "PENDING",
			images: [
				{
					imageId: "pending-newer",
					url: "https://cdn.example.com/pending-newer.jpg",
				},
			],
		});
	});

	it("counts listings from listing status instead of legacy approval flags", async () => {
		await seedListing(db, {
			id: "approved-electric",
			name: "Approved Electric",
			listingStatus: "APPROVED",
			isApproved: true,
			category: "ELECTRIC",
		});
		await seedListing(db, {
			id: "approved-acoustic-status-only",
			name: "Approved Acoustic Status Only",
			listingStatus: "APPROVED",
			isApproved: false,
			category: "ACOUSTIC",
		});
		await seedListing(db, {
			id: "pending-keyboard",
			name: "Pending Keyboard",
			listingStatus: "PENDING",
			isApproved: false,
			category: "KEYBOARD",
		});
		await seedListing(db, {
			id: "withdrawn-legacy-approved",
			name: "Withdrawn Legacy Approved",
			listingStatus: "WITHDRAWN",
			isApproved: true,
			category: "ELECTRIC",
		});

		const categoryCounts = await queries.countApprovedByCategory();

		expect(
			[...categoryCounts].sort((a, b) => a.category.localeCompare(b.category)),
		).toEqual([
			{ category: "ACOUSTIC", count: 1 },
			{ category: "ELECTRIC", count: 1 },
		]);
		await expect(queries.countByStatus("APPROVED")).resolves.toBe(2);
		await expect(queries.countByStatus("PENDING")).resolves.toBe(1);
	});

	it("counts approved brands with normalized casing and spacing", async () => {
		await seedListing(db, {
			id: "fender-title",
			name: "Fender Title",
			listingStatus: "APPROVED",
			isApproved: true,
			brand: "Fender",
		});
		await seedListing(db, {
			id: "fender-lower",
			name: "Fender Lower",
			listingStatus: "APPROVED",
			isApproved: true,
			brand: " fender ",
		});
		await seedListing(db, {
			id: "yamaha",
			name: "Yamaha",
			listingStatus: "APPROVED",
			isApproved: true,
			brand: "Yamaha",
		});
		await seedListing(db, {
			id: "pending-fender",
			name: "Pending Fender",
			listingStatus: "PENDING",
			isApproved: false,
			brand: "Fender",
		});

		const brandCounts = await queries.listPopularApprovedBrandCounts();

		expect(brandCounts).toEqual([
			{ brand: "Fender", count: 2 },
			{ brand: "Yamaha", count: 1 },
		]);
	});

	it("returns recent approved listings by latest update", async () => {
		await seedListing(db, {
			id: "approved-newer",
			name: "Approved Newer",
			listingStatus: "APPROVED",
			isApproved: true,
			updatedAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedListing(db, {
			id: "withdrawn-latest",
			name: "Withdrawn Latest",
			listingStatus: "WITHDRAWN",
			isApproved: true,
			updatedAt: new Date("2026-06-18T04:00:00.000Z"),
		});
		await seedListing(db, {
			id: "approved-older",
			name: "Approved Older",
			listingStatus: "APPROVED",
			isApproved: true,
			updatedAt: new Date("2026-06-18T02:00:00.000Z"),
		});

		const listings = await queries.listRecentApproved(8);

		expect(listings.map((listing) => listing.id)).toEqual([
			"approved-newer",
			"approved-older",
		]);
		expect(listings[0]).toMatchObject({
			id: "approved-newer",
			images: [
				{
					imageId: "approved-newer",
					url: "https://cdn.example.com/approved-newer.jpg",
				},
			],
		});
	});

	it("returns cart listings for requested ids with image URLs", async () => {
		await seedListing(db, {
			id: "cart-approved",
			name: "Cart Approved",
			listingStatus: "APPROVED",
			isApproved: true,
		});
		await seedListing(db, {
			id: "cart-pending",
			name: "Cart Pending",
			listingStatus: "PENDING",
			isApproved: false,
		});
		await seedListing(db, {
			id: "cart-unrequested",
			name: "Cart Unrequested",
			listingStatus: "APPROVED",
			isApproved: true,
		});

		const listings = await queries.findByIds(["cart-approved", "cart-pending"]);

		expect(
			[...listings].sort((a, b) => a.id.localeCompare(b.id)),
		).toMatchObject([
			{
				id: "cart-approved",
				images: [
					{
						imageId: "cart-approved",
						url: "https://cdn.example.com/cart-approved.jpg",
					},
				],
				seller: { email: "seller@example.com" },
			},
			{
				id: "cart-pending",
				images: [
					{
						imageId: "cart-pending",
						url: "https://cdn.example.com/cart-pending.jpg",
					},
				],
				seller: { email: "seller@example.com" },
			},
		]);
	});
});
