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

type ProductActions = typeof import("./product");

const databaseUrl = process.env.DATABASE_URL;
const runDbTests = process.env.RUN_DB_TESTS === "1" && Boolean(databaseUrl);
const describeDb = runDbTests ? describe : describe.skip;
const sellerOneId = "product-action-seller-1";
const sellerTwoId = "product-action-seller-2";
const testUserIds = [sellerOneId, sellerTwoId];
const testProductIds = [
	"product-action-cart-1",
	"product-action-cart-2",
	"product-action-approved-newer",
	"product-action-pending-latest",
	"product-action-approved-older",
];

describeDb("product read actions Prisma integration", () => {
	let db: PrismaClient;
	let productActions: ProductActions;
	let connectDb: typeof import("@/data/connect-db");

	beforeAll(async () => {
		vi.doMock("@/env", () => ({
			env: {
				DATABASE_URL: databaseUrl,
			},
		}));

		db = new PrismaClient({
			adapter: new PrismaPg({
				connectionString: databaseUrl as string,
			}),
		});
		productActions = await import("./product");
		connectDb = await import("@/data/connect-db");
	});

	beforeEach(async () => {
		await cleanTestRecords(db);
		await seedUsers(db);
	});

	afterAll(async () => {
		await cleanTestRecords(db);
		await db.$disconnect();
		await connectDb?.prisma.$disconnect();
	});

	it("returns cart products with image URLs through the real repository", async () => {
		await seedProduct(db, {
			id: "product-action-cart-1",
			name: "Cart Telecaster",
			sellerId: sellerOneId,
		});
		await seedProduct(db, {
			id: "product-action-cart-2",
			name: "Cart Jazzmaster",
			sellerId: sellerTwoId,
		});

		const result = await productActions.getProductsByIdsService("CUSTOMER", {
			ids: ["product-action-cart-1", "product-action-cart-2"],
		});

		expectProductArray(result);
		expect(result).toHaveLength(2);
		expect(productById(result, "product-action-cart-1")).toMatchObject({
			id: "product-action-cart-1",
			name: "Cart Telecaster",
			images: [imageUrl("product-action-cart-1")],
			seller: {
				email: `${sellerOneId}@example.com`,
			},
		});
		expect(productById(result, "product-action-cart-2")).toMatchObject({
			id: "product-action-cart-2",
			name: "Cart Jazzmaster",
			images: [imageUrl("product-action-cart-2")],
			seller: {
				email: `${sellerTwoId}@example.com`,
			},
		});
	});

	it("returns counts and recent products through the real repository", async () => {
		await seedProduct(db, {
			id: "product-action-approved-newer",
			name: "Approved Newer",
			listingStatus: "APPROVED",
			isApproved: true,
			updatedAt: new Date("2026-06-18T03:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "product-action-pending-latest",
			name: "Pending Latest",
			listingStatus: "PENDING",
			isApproved: false,
			updatedAt: new Date("2026-06-18T04:00:00.000Z"),
		});
		await seedProduct(db, {
			id: "product-action-approved-older",
			name: "Approved Older",
			listingStatus: "APPROVED",
			isApproved: true,
			updatedAt: new Date("2026-06-18T02:00:00.000Z"),
		});

		await expect(
			productActions.getProductCountByCategoryService(),
		).resolves.toEqual([{ category: "ELECTRIC", count: 2 }]);
		await expect(
			productActions.getProductCountByStatusService(true),
		).resolves.toEqual({
			approvedProductCount: 2,
		});
		await expect(
			productActions.getProductCountByStatusService(false),
		).resolves.toEqual({
			pendingProductCount: 1,
		});

		const recent = await productActions.getRecentProductsService(8);

		expect(recent.map((product) => product.id)).toEqual([
			"product-action-approved-newer",
			"product-action-approved-older",
		]);
		expect(recent[0]).toMatchObject({
			images: [imageUrl("product-action-approved-newer")],
		});
	});
});

type ProductArray = Awaited<
	ReturnType<ProductActions["getProductsByIdsService"]>
>;

function expectProductArray(
	result: ProductArray,
): asserts result is Extract<ProductArray, unknown[]> {
	expect(Array.isArray(result)).toBe(true);
	if (!Array.isArray(result)) {
		throw new Error(`Expected products, received ${JSON.stringify(result)}`);
	}
}

function productById(products: Extract<ProductArray, unknown[]>, id: string) {
	const product = products.find((item) => item.id === id);
	if (!product) {
		throw new Error(`Expected product ${id} in read result`);
	}
	return product;
}

async function seedUsers(db: PrismaClient) {
	await db.user.createMany({
		data: [
			{
				id: sellerOneId,
				email: `${sellerOneId}@example.com`,
				firstName: "A",
				lastName: "Seller",
				password: "password",
				role: "SELLER",
			},
			{
				id: sellerTwoId,
				email: `${sellerTwoId}@example.com`,
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
		sellerId = sellerOneId,
		name,
		listingStatus = "APPROVED",
		isApproved = listingStatus === "APPROVED",
		price = 199.95,
		priceCents = 19995,
		createdAt,
		updatedAt,
	}: {
		id: string;
		sellerId?: string;
		name: string;
		listingStatus?: ListingStatus;
		isApproved?: boolean;
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
			category: "ELECTRIC",
			condition: "USED",
			brand: "Fender",
			model: "American Standard",
			images: [
				{
					url: imageUrl(id),
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

function imageUrl(id: string) {
	return `https://cdn.example.com/${id}.jpg`;
}

async function cleanTestRecords(db: PrismaClient) {
	await db.product.deleteMany({
		where: {
			id: {
				in: testProductIds,
			},
		},
	});
	await db.user.deleteMany({
		where: {
			id: {
				in: testUserIds,
			},
		},
	});
}
