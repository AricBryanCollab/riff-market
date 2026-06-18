import { PrismaPg } from "@prisma/adapter-pg";
import { type ListingStatus, PrismaClient } from "generated/prisma/client";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const runDbTests = process.env.RUN_DB_TESTS === "1" && Boolean(databaseUrl);
const describeDb = runDbTests ? describe : describe.skip;

describeDb("product read repository Prisma integration", () => {
	let db: PrismaClient;
	let productRepo: typeof import("./product-repo");
	let connectDb: typeof import("./connect-db");

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
		productRepo = await import("./product-repo");
		connectDb = await import("./connect-db");
	});

	beforeEach(async () => {
		await cleanDatabase(db);
		await seedSeller(db);
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await db.$disconnect();
		await connectDb?.prisma.$disconnect();
	});

	it("searches only approved listings through the read interface", async () => {
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

		const products = await productRepo.getApprovedProducts({
			limit: 10,
			offset: 0,
			random: false,
			priceMinCents: undefined,
			priceMaxCents: undefined,
		});

		expect(products.map((product) => product.id)).toEqual([
			"approved-1",
			"approved-status-only",
		]);
	});

	it("keeps declined and withdrawn listings out of pending moderation reads and counts", async () => {
		await seedProduct(db, {
			id: "pending-1",
			name: "Pending Listing",
			listingStatus: "PENDING",
			isApproved: false,
		});
		await seedProduct(db, {
			id: "declined-1",
			name: "Declined Listing",
			listingStatus: "DECLINED",
			isApproved: false,
		});
		await seedProduct(db, {
			id: "withdrawn-1",
			name: "Withdrawn Listing",
			listingStatus: "WITHDRAWN",
			isApproved: false,
		});
		await seedProduct(db, {
			id: "approved-1",
			name: "Approved Listing",
			listingStatus: "APPROVED",
			isApproved: true,
		});

		const pending = await productRepo.getPendingApprovalProducts();

		expect(pending.map((product) => product.id)).toEqual(["pending-1"]);
		await expect(productRepo.getProductCountByStatus(false)).resolves.toBe(1);
		await expect(productRepo.getProductCountByStatus(true)).resolves.toBe(1);
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

		const products = await productRepo.getApprovedProducts({
			limit: 10,
			offset: 0,
			random: false,
			priceMinCents: 19995,
			priceMaxCents: 19995,
		});

		expect(products.map((product) => product.id).sort()).toEqual([
			"cent-priced",
			"legacy-priced",
		]);
	});

	it("returns recent products from approved listings only", async () => {
		await seedProduct(db, {
			id: "approved-newer",
			name: "Approved Newer",
			listingStatus: "APPROVED",
			isApproved: true,
			updatedAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "withdrawn-latest",
			name: "Withdrawn Latest",
			listingStatus: "WITHDRAWN",
			isApproved: true,
			updatedAt: new Date("2026-06-18T04:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "approved-older",
			name: "Approved Older",
			listingStatus: "APPROVED",
			isApproved: true,
			updatedAt: new Date("2026-06-18T02:00:00.000Z"),
		});

		const products = await productRepo.getRecentProducts(8);

		expect(products.map((product) => product.id)).toEqual([
			"approved-newer",
			"approved-older",
		]);
	});
});

async function seedSeller(db: PrismaClient) {
	await db.user.create({
		data: {
			id: "seller-1",
			email: "seller@example.com",
			firstName: "A",
			lastName: "Seller",
			password: "password",
			role: "SELLER",
		},
	});
}

async function seedProduct(
	db: PrismaClient,
	{
		id,
		name,
		listingStatus,
		isApproved,
		price = 199.95,
		priceCents = 19995,
		createdAt,
		updatedAt,
	}: {
		id: string;
		name: string;
		listingStatus: ListingStatus;
		isApproved: boolean;
		price?: number;
		priceCents?: number | null;
		createdAt?: Date;
		updatedAt?: Date;
	},
) {
	await db.product.create({
		data: {
			id,
			sellerId: "seller-1",
			name,
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			model: "American Standard",
			images: [
				{
					url: `https://cdn.example.com/${id}.jpg`,
					publicId: id,
				},
			],
			description: "A test listing",
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
