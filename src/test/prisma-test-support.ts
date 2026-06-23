import { PrismaPg } from "@prisma/adapter-pg";
import {
	type ListingStatus,
	type PaymentStatus,
	PrismaClient,
	type ProductCategory,
	type ProductCondtion,
	type PurchaseStatus,
	type Role,
	type SellerOrderStatus,
} from "generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe } from "vitest";
import type { ImageAssetRef } from "@/types/image-asset";

const databaseUrl = process.env.TEST_DATABASE_URL;
const databaseUrlSource = "TEST_DATABASE_URL";
const runDbTests = process.env.RUN_DB_TESTS === "1";
const safeTestDatabaseNamePattern =
	/(^|[_-])(test|testing|vitest|integration)([_-]|$)/;

export const describeDb = runDbTests ? describe : describe.skip;

export function createTestPrismaClient() {
	const connectionString = requireSafeTestDatabaseUrl(
		databaseUrl,
		databaseUrlSource,
	);

	return new PrismaClient({
		adapter: new PrismaPg({
			connectionString,
		}),
	});
}

export function requireSafeTestDatabaseUrl(
	connectionString: string | undefined,
	sourceName = "TEST_DATABASE_URL",
) {
	if (!connectionString) {
		throw new Error("TEST_DATABASE_URL is required to run Prisma tests");
	}

	const databaseName = databaseNameFromUrl(connectionString, sourceName);

	if (!safeTestDatabaseNamePattern.test(databaseName.toLowerCase())) {
		throw new Error(
			`${sourceName} points to database "${databaseName}". Prisma tests delete rows; use TEST_DATABASE_URL with a database name containing test, testing, vitest, or integration.`,
		);
	}

	return connectionString;
}

function databaseNameFromUrl(connectionString: string, sourceName: string) {
	let url: URL;

	try {
		url = new URL(connectionString);
	} catch {
		throw new Error(`${sourceName} must be a valid database URL`);
	}

	const databaseName = decodeURIComponent(
		url.pathname.split("/").filter(Boolean).at(-1) ?? "",
	);

	if (!databaseName) {
		throw new Error(`${sourceName} must include a database name`);
	}

	return databaseName;
}

export function setupPrismaTestDatabase() {
	let client: PrismaClient | undefined;

	beforeAll(() => {
		client = createTestPrismaClient();
	});

	beforeEach(async () => {
		await cleanDatabase(getClient());
	});

	afterAll(async () => {
		if (!client) {
			return;
		}

		try {
			await cleanDatabase(client);
		} finally {
			await client.$disconnect();
		}
	});

	return {
		get client() {
			return getClient();
		},
	};

	function getClient() {
		if (!client) {
			throw new Error("Prisma test database was accessed before setup");
		}

		return client;
	}
}

export async function cleanDatabase(db: PrismaClient) {
	await db.mediaCleanupJob.deleteMany();
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
	await db.message.deleteMany();
	await db.chatBotSession.deleteMany();
	await db.appSettings.deleteMany();
}

type TestUserSeed = {
	readonly id: string;
	readonly email?: string;
	readonly firstName?: string;
	readonly lastName?: string;
	readonly password?: string;
	readonly role: Role;
};

const defaultMarketplaceUsers = [
	{
		id: "customer-1",
		email: "customer@example.com",
		firstName: "Pat",
		lastName: "Buyer",
		role: "CUSTOMER",
	},
	{
		id: "seller-1",
		email: "seller-1@example.com",
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
	{
		id: "admin-1",
		email: "admin@example.com",
		firstName: "Admin",
		lastName: "User",
		role: "ADMIN",
	},
] as const satisfies readonly TestUserSeed[];

export async function seedMarketplaceUsers(
	db: PrismaClient,
	users: readonly TestUserSeed[] = defaultMarketplaceUsers,
) {
	await db.user.createMany({
		data: users.map((user) => ({
			id: user.id,
			email: user.email ?? `${user.id}@example.com`,
			firstName: user.firstName ?? "Test",
			lastName: user.lastName ?? "User",
			password: user.password ?? "password",
			role: user.role,
		})),
	});
}

type TestListingSeed = {
	readonly id: string;
	readonly sellerId?: string;
	readonly name?: string;
	readonly category?: ProductCategory;
	readonly condition?: ProductCondtion;
	readonly brand?: string;
	readonly model?: string;
	readonly images?: readonly ImageAssetRef[];
	readonly description?: string;
	readonly price?: number;
	readonly priceCents?: number | null;
	readonly currencyCode?: string;
	readonly stock?: number;
	readonly isApproved?: boolean;
	readonly listingStatus?: ListingStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
};

export async function seedListing(db: PrismaClient, listing: TestListingSeed) {
	const priceCents =
		listing.priceCents === undefined ? 19995 : listing.priceCents;
	const price =
		listing.price ??
		(typeof priceCents === "number" ? priceCents / 100 : 199.95);

	await db.product.create({
		data: {
			id: listing.id,
			sellerId: listing.sellerId ?? "seller-1",
			name: listing.name ?? "Telecaster",
			category: listing.category ?? "ELECTRIC",
			condition: listing.condition ?? "USED",
			brand: listing.brand ?? "Fender",
			model: listing.model ?? "American Standard",
			images: listing.images ?? [
				{
					url: `https://cdn.example.com/${listing.id}.jpg`,
					publicId: listing.id,
				},
			],
			description: listing.description ?? "A test listing",
			price,
			priceCents,
			currencyCode: listing.currencyCode ?? "USD",
			stock: listing.stock ?? 2,
			isApproved: listing.isApproved ?? true,
			listingStatus: listing.listingStatus ?? "APPROVED",
			...(listing.createdAt && { createdAt: listing.createdAt }),
			...(listing.updatedAt && { updatedAt: listing.updatedAt }),
		},
	});
}

export const seedProduct = seedListing;

export async function productStock(db: PrismaClient, id: string) {
	const product = await db.product.findUniqueOrThrow({
		where: { id },
		select: { stock: true },
	});

	return product.stock;
}

type TestSellerOrderItemSeed = {
	readonly id: string;
	readonly listingId: string;
	readonly listingName?: string;
	readonly brand?: string;
	readonly model?: string;
	readonly category?: string;
	readonly condition?: string;
	readonly primaryImageUrl?: string;
	readonly sellerId?: string;
	readonly sellerDisplayName?: string;
	readonly unitPriceCents: number;
	readonly quantity: number;
	readonly subTotalCents?: number;
	readonly currencyCode?: string;
};

type TestSellerOrderSeed = {
	readonly id: string;
	readonly sellerId?: string | null;
	readonly sellerIdSnapshot?: string;
	readonly subtotalCents: number;
	readonly currencyCode?: string;
	readonly status?: SellerOrderStatus;
	readonly trackingNumber?: string | null;
	readonly items: readonly TestSellerOrderItemSeed[];
};

type TestPurchaseWithSellerOrdersSeed = {
	readonly id?: string;
	readonly customerId?: string | null;
	readonly customerIdSnapshot?: string;
	readonly purchaseNumber?: string;
	readonly totalAmountCents: number;
	readonly currencyCode?: string;
	readonly paymentStatus?: PaymentStatus;
	readonly status?: PurchaseStatus;
	readonly buyerName?: string;
	readonly buyerEmail?: string;
	readonly buyerPhone?: string | null;
	readonly shippingAddress?: string;
	readonly sellerOrders: readonly TestSellerOrderSeed[];
};

export async function seedPurchaseWithSellerOrders(
	db: PrismaClient,
	purchase: TestPurchaseWithSellerOrdersSeed,
) {
	await db.purchase.create({
		data: {
			id: purchase.id ?? "purchase-1",
			customerId:
				purchase.customerId === undefined ? "customer-1" : purchase.customerId,
			customerIdSnapshot: purchase.customerIdSnapshot ?? "customer-1",
			purchaseNumber: purchase.purchaseNumber ?? "RM-1",
			totalAmountCents: purchase.totalAmountCents,
			currencyCode: purchase.currencyCode ?? "USD",
			paymentStatus: purchase.paymentStatus ?? "MANUALLY_CONFIRMED",
			status: purchase.status ?? "OPEN",
			buyerName: purchase.buyerName ?? "Pat Buyer",
			buyerEmail: purchase.buyerEmail ?? "customer@example.com",
			buyerPhone:
				purchase.buyerPhone === undefined ? null : purchase.buyerPhone,
			shippingAddress: purchase.shippingAddress ?? "123 Market St",
			sellerOrders: {
				create: purchase.sellerOrders.map(toSellerOrderCreate),
			},
		},
	});
}

function toSellerOrderCreate(order: TestSellerOrderSeed) {
	return {
		id: order.id,
		sellerId:
			order.sellerId === undefined
				? (order.sellerIdSnapshot ?? "seller-1")
				: order.sellerId,
		sellerIdSnapshot: order.sellerIdSnapshot ?? order.sellerId ?? "seller-1",
		subtotalCents: order.subtotalCents,
		currencyCode: order.currencyCode ?? "USD",
		status: order.status ?? "NEW",
		trackingNumber:
			order.trackingNumber === undefined ? null : order.trackingNumber,
		items: {
			create: order.items.map((item) => toSellerOrderItemCreate(item, order)),
		},
	};
}

function toSellerOrderItemCreate(
	item: TestSellerOrderItemSeed,
	order: TestSellerOrderSeed,
) {
	const sellerId =
		item.sellerId ?? order.sellerIdSnapshot ?? order.sellerId ?? "seller-1";

	return {
		id: item.id,
		listingId: item.listingId,
		listingName: item.listingName ?? "Telecaster",
		brand: item.brand ?? "Fender",
		model: item.model ?? "American Standard",
		category: item.category ?? "ELECTRIC",
		condition: item.condition ?? "USED",
		primaryImageUrl:
			item.primaryImageUrl ?? `https://cdn.example.com/${item.listingId}.jpg`,
		sellerId,
		sellerDisplayName: item.sellerDisplayName ?? "A Seller",
		unitPriceCents: item.unitPriceCents,
		quantity: item.quantity,
		subTotalCents: item.subTotalCents ?? item.unitPriceCents * item.quantity,
		currencyCode: item.currencyCode ?? "USD",
	};
}
