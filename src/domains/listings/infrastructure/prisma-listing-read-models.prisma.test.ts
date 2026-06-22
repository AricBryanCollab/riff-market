import { PrismaPg } from "@prisma/adapter-pg";
import {
	type ListingStatus,
	PrismaClient,
	type ProductCategory,
	type ProductCondtion,
} from "generated/prisma/client";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { PrismaListingReadModels } from "./prisma-listing-read-models";

const databaseUrl = process.env.DATABASE_URL;
const runDbTests = process.env.RUN_DB_TESTS === "1" && Boolean(databaseUrl);
const describeDb = runDbTests ? describe : describe.skip;

describeDb("Prisma listing read models", () => {
	let db: PrismaClient;
	let readModels: PrismaListingReadModels;

	beforeAll(async () => {
		vi.doMock("@/env", () => ({
			env: {
				DATABASE_URL: databaseUrl,
			},
		}));

		db = new PrismaClient({
			adapter: new PrismaPg({
				connectionString: databaseUrl,
			}),
		});
		readModels = new PrismaListingReadModels(db);
	});

	beforeEach(async () => {
		await cleanDatabase(db);
		await seedSeller(db);
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await db.$disconnect();
	});

	it("searches only approved listings through the listing read model", async () => {
		await seedProduct(db, {
			id: "approved-1",
			name: "Approved Telecaster",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "approved-status-only",
			name: "Approved Status Only",
			listingStatus: "APPROVED",
			isApproved: false,
			createdAt: new Date("2026-06-18T02:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "legacy-flag-only",
			name: "Legacy Flag Only",
			listingStatus: "WITHDRAWN",
			isApproved: true,
			createdAt: new Date("2026-06-18T01:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "declined-1",
			name: "Declined Listing",
			listingStatus: "DECLINED",
			isApproved: false,
		});
		await seedProduct(db, {
			id: "pending-1",
			name: "Pending Listing",
			listingStatus: "PENDING",
			isApproved: false,
		});

		const listings = await readModels.searchApproved({
			limit: 10,
			offset: 0,
			random: false,
			priceMinCents: undefined,
			priceMaxCents: undefined,
		});

		expect(listings.map((listing) => listing.id)).toEqual([
			"approved-1",
			"approved-status-only",
		]);
		expect(listings[0]?.images).toEqual([
			"https://cdn.example.com/approved-1.jpg",
		]);
	});

	it("applies cent-based price filters with legacy float fallback for approved listings", async () => {
		await seedProduct(db, {
			id: "cent-priced",
			name: "Cent Priced",
			listingStatus: "APPROVED",
			isApproved: true,
			price: 199.95,
			priceCents: 19995,
		});
		await seedProduct(db, {
			id: "legacy-priced",
			name: "Legacy Priced",
			listingStatus: "APPROVED",
			isApproved: true,
			price: 199.95,
			priceCents: null,
		});
		await seedProduct(db, {
			id: "outside-range",
			name: "Outside Range",
			listingStatus: "APPROVED",
			isApproved: true,
			price: 350,
			priceCents: 35000,
		});

		const listings = await readModels.searchApproved({
			limit: 10,
			offset: 0,
			random: false,
			priceMinCents: 19995,
			priceMaxCents: 19995,
		});

		expect(listings.map((listing) => listing.id).sort()).toEqual([
			"cent-priced",
			"legacy-priced",
		]);
	});

	it("applies category, condition, brand, and search filters to approved listings", async () => {
		await seedProduct(db, {
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
		await seedProduct(db, {
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
		await seedProduct(db, {
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
		await seedProduct(db, {
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
		await seedProduct(db, {
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
		await seedProduct(db, {
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

		const listings = await readModels.searchApproved({
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
		await seedProduct(db, {
			id: "pending-detail",
			name: "Pending Detail",
			listingStatus: "PENDING",
			isApproved: false,
		});

		const listing = await readModels.findById("pending-detail");

		expect(listing).toMatchObject({
			id: "pending-detail",
			listingStatus: "PENDING",
			images: ["https://cdn.example.com/pending-detail.jpg"],
		});
	});

	it("returns a seller's listings newest first without other sellers' listings", async () => {
		await seedProduct(db, {
			id: "seller-older",
			name: "Seller Older",
			listingStatus: "PENDING",
			isApproved: false,
			createdAt: new Date("2026-06-18T01:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "seller-newer",
			name: "Seller Newer",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "other-seller",
			name: "Other Seller",
			sellerId: "seller-2",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T04:00:00.000Z"),
		});

		const listings = await readModels.listForSeller("seller-1");

		expect(listings.map((listing) => listing.id)).toEqual([
			"seller-newer",
			"seller-older",
		]);
		expect(listings[0]).toMatchObject({
			id: "seller-newer",
			images: ["https://cdn.example.com/seller-newer.jpg"],
		});
	});

	it("returns pending moderation listings newest first without final-status listings", async () => {
		await seedProduct(db, {
			id: "pending-older",
			name: "Pending Older",
			listingStatus: "PENDING",
			isApproved: false,
			createdAt: new Date("2026-06-18T01:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "pending-newer",
			name: "Pending Newer",
			listingStatus: "PENDING",
			isApproved: false,
			createdAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "declined-listing",
			name: "Declined Listing",
			listingStatus: "DECLINED",
			isApproved: false,
			createdAt: new Date("2026-06-18T04:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "withdrawn-listing",
			name: "Withdrawn Listing",
			listingStatus: "WITHDRAWN",
			isApproved: false,
			createdAt: new Date("2026-06-18T05:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "approved-listing",
			name: "Approved Listing",
			listingStatus: "APPROVED",
			isApproved: true,
			createdAt: new Date("2026-06-18T06:00:00.000Z"),
		});

		const listings = await readModels.listPendingModeration();

		expect(listings.map((listing) => listing.id)).toEqual([
			"pending-newer",
			"pending-older",
		]);
		expect(listings[0]).toMatchObject({
			id: "pending-newer",
			listingStatus: "PENDING",
			images: ["https://cdn.example.com/pending-newer.jpg"],
		});
	});
});

async function seedSeller(db: PrismaClient) {
	await db.user.createMany({
		data: [
			{
				id: "seller-1",
				email: "seller@example.com",
				firstName: "A",
				lastName: "Seller",
				password: "password",
				role: "SELLER",
			},
			{
				id: "seller-2",
				email: "seller-2@example.com",
				firstName: "B",
				lastName: "Seller",
				password: "password",
				role: "SELLER",
			},
		],
	});
}

async function seedProduct(
	db: PrismaClient,
	{
		id,
		sellerId = "seller-1",
		name,
		listingStatus,
		isApproved,
		category = "ELECTRIC",
		condition = "USED",
		brand = "Fender",
		model = "American Standard",
		description = "A test listing",
		price = 199.95,
		priceCents = 19995,
		createdAt,
		updatedAt,
	}: {
		id: string;
		sellerId?: string;
		name: string;
		listingStatus: ListingStatus;
		isApproved: boolean;
		category?: ProductCategory;
		condition?: ProductCondtion;
		brand?: string;
		model?: string;
		description?: string;
		price?: number;
		priceCents?: number | null;
		createdAt?: Date;
		updatedAt?: Date;
	},
) {
	await db.product.create({
		data: {
			id,
			sellerId,
			name,
			category,
			condition,
			brand,
			model,
			images: [
				{
					url: `https://cdn.example.com/${id}.jpg`,
					publicId: id,
				},
			],
			description,
			price,
			priceCents,
			currencyCode: "USD",
			stock: 2,
			isApproved,
			listingStatus,
			...(createdAt && { createdAt }),
			...(updatedAt && { updatedAt }),
		},
	});
}

async function cleanDatabase(db: PrismaClient) {
	await db.notification.deleteMany();
	await db.sellerOrderItem.deleteMany();
	await db.sellerOrder.deleteMany();
	await db.purchase.deleteMany();
	await db.favorite.deleteMany();
	await db.review.deleteMany();
	await db.orderItem.deleteMany();
	await db.order.deleteMany();
	await db.product.deleteMany();
	await db.userSettings.deleteMany();
	await db.user.deleteMany();
}
