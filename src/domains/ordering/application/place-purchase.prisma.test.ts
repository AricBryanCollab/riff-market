import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "generated/prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ChangeSellerOrderStatus } from "@/domains/ordering/application/change-seller-order-status";
import {
	ListBuyerPurchaseHistory,
	ListSellerOrderDashboard,
} from "@/domains/ordering/application/order-read-models";
import type {
	PurchaseNumberGeneratorPort,
	PurchasePlacedNotificationCreatorPort,
	PurchasePlacedNotificationInput,
} from "@/domains/ordering/application/place-purchase";
import { PrismaOrderReadModels } from "@/domains/ordering/infrastructure/prisma-order-read-models";
import { createPrismaPlacePurchase } from "@/domains/ordering/infrastructure/prisma-place-purchase";
import { PrismaPurchasePlacedNotificationCreator } from "@/domains/ordering/infrastructure/prisma-purchase-placed-notification-creator";
import { PrismaSellerOrderStatusRepository } from "@/domains/ordering/infrastructure/prisma-seller-order-status-repository";
import type { PrismaTransactionContext } from "@/domains/shared/infrastructure/prisma-unit-of-work";

const databaseUrl = process.env.DATABASE_URL;
const runDbTests = process.env.RUN_DB_TESTS === "1" && Boolean(databaseUrl);
const describeDb = runDbTests ? describe : describe.skip;

describeDb("PlacePurchase Prisma integration", () => {
	let db: PrismaClient;

	beforeAll(() => {
		db = new PrismaClient({
			adapter: new PrismaPg({
				connectionString: databaseUrl,
			}),
		});
	});

	beforeEach(async () => {
		await cleanDatabase(db);
	});

	afterAll(async () => {
		await cleanDatabase(db);
		await db.$disconnect();
	});

	it("persists purchase placement, seller orders, notifications, and guarded stock reduction", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 2,
		});
		await seedProduct(db, {
			id: "listing-2",
			sellerId: "seller-2",
			name: "Jazzmaster",
			priceCents: 75_00,
			stock: 3,
		});
		const useCase = createUseCase(db, new SequentialPurchaseNumberGenerator());

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [
					{ listingId: "listing-1", quantity: 1 },
					{ listingId: "listing-2", quantity: 2 },
				],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
		);

		expect(result).toEqual({
			ok: true,
			value: expect.objectContaining({
				purchaseNumber: "RM-1",
				total: expect.objectContaining({
					amountCents: 275_00,
					currencyCode: "USD",
				}),
				paymentStatus: "MANUALLY_CONFIRMED",
				status: "OPEN",
			}),
		});
		const purchase = await db.purchase.findUniqueOrThrow({
			where: { purchaseNumber: "RM-1" },
			include: {
				sellerOrders: {
					include: {
						items: true,
					},
					orderBy: {
						sellerId: "asc",
					},
				},
				notifications: true,
			},
		});

		expect(purchase).toMatchObject({
			customerId: "customer-1",
			customerIdSnapshot: "customer-1",
			totalAmountCents: 275_00,
			currencyCode: "USD",
			paymentStatus: "MANUALLY_CONFIRMED",
			status: "OPEN",
			buyerName: "Pat Buyer",
			buyerEmail: "pat@example.com",
			buyerPhone: null,
			shippingAddress: "123 Market St",
		});
		expect(purchase.sellerOrders).toHaveLength(2);
		expect(purchase.sellerOrders[0]).toMatchObject({
			sellerId: "seller-1",
			sellerIdSnapshot: "seller-1",
			subtotalCents: 125_00,
			currencyCode: "USD",
			status: "NEW",
			trackingNumber: null,
			items: [
				expect.objectContaining({
					listingId: "listing-1",
					unitPriceCents: 125_00,
					quantity: 1,
					subTotalCents: 125_00,
				}),
			],
		});
		expect(purchase.sellerOrders[1]).toMatchObject({
			sellerId: "seller-2",
			sellerIdSnapshot: "seller-2",
			subtotalCents: 150_00,
			status: "NEW",
			items: [
				expect.objectContaining({
					listingId: "listing-2",
					unitPriceCents: 75_00,
					quantity: 2,
					subTotalCents: 150_00,
				}),
			],
		});
		expect(await productStock(db, "listing-1")).toBe(1);
		expect(await productStock(db, "listing-2")).toBe(1);
		expect(await db.notification.count()).toBe(3);
		expect(
			await db.notification.count({
				where: {
					purchaseId: purchase.id,
					sellerOrderId: {
						not: null,
					},
				},
			}),
		).toBe(2);
	});

	it("serves buyer history and seller dashboard reads from target models", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 2,
		});
		await seedProduct(db, {
			id: "listing-2",
			sellerId: "seller-2",
			name: "Jazzmaster",
			priceCents: 75_00,
			stock: 3,
		});
		const useCase = createUseCase(db, new SequentialPurchaseNumberGenerator());

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [
					{ listingId: "listing-1", quantity: 1 },
					{ listingId: "listing-2", quantity: 2 },
				],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error(result.error.message);
		}

		const readModels = new PrismaOrderReadModels(db);
		const buyerHistory = await new ListBuyerPurchaseHistory(readModels).execute(
			{
				id: "customer-1",
				role: "CUSTOMER",
			},
		);

		expect(buyerHistory).toEqual({
			ok: true,
			value: [
				expect.objectContaining({
					id: result.value.purchaseId,
					purchaseId: result.value.purchaseId,
					trackingNumber: "RM-1",
					totalAmount: 275,
					shippingAddress: "123 Market St",
					status: "OPEN",
					items: expect.arrayContaining([
						expect.objectContaining({
							productId: "listing-1",
							quantity: 1,
							unitPrice: 125,
							subTotal: 125,
							product: expect.objectContaining({
								name: "Telecaster",
								images: ["https://cdn.example.com/listing-1.jpg"],
							}),
						}),
						expect.objectContaining({
							productId: "listing-2",
							quantity: 2,
							unitPrice: 75,
							subTotal: 150,
						}),
					]),
				}),
			],
		});

		const sellerDashboard = await new ListSellerOrderDashboard(
			readModels,
		).execute({
			id: "seller-1",
			role: "SELLER",
		});

		expect(sellerDashboard).toEqual({
			ok: true,
			value: [
				expect.objectContaining({
					purchaseId: result.value.purchaseId,
					trackingNumber: "RM-1",
					totalAmount: 125,
					status: "NEW",
					customer: {
						id: "customer-1",
						email: "pat@example.com",
						firstName: "Pat",
						lastName: "Buyer",
					},
					items: [
						expect.objectContaining({
							productId: "listing-1",
							quantity: 1,
						}),
					],
				}),
			],
		});
	});

	it("updates seller order status through the target repository", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 2,
		});
		const placePurchase = createUseCase(
			db,
			new SequentialPurchaseNumberGenerator(),
		);
		const placed = await placePurchase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [{ listingId: "listing-1", quantity: 1 }],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
		);

		expect(placed.ok).toBe(true);
		if (!placed.ok) {
			throw new Error(placed.error.message);
		}
		const sellerOrderId = placed.value.sellerOrderIds[0];
		if (!sellerOrderId) {
			throw new Error("Expected seller order");
		}

		const changeStatus = new ChangeSellerOrderStatus(
			new PrismaSellerOrderStatusRepository(db),
		);
		const denied = await changeStatus.execute(
			{ id: "seller-2", role: "SELLER" },
			{ sellerOrderId, status: "PROCESSING" },
		);

		expect(denied).toMatchObject({
			ok: false,
			error: {
				code: "CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
			},
		});

		const processed = await changeStatus.execute(
			{ id: "seller-1", role: "SELLER" },
			{ sellerOrderId, status: "PROCESSING" },
		);
		expect(processed).toMatchObject({
			ok: true,
			value: {
				sellerOrderId,
				status: "PROCESSING",
			},
		});

		const shipped = await changeStatus.execute(
			{ id: "seller-1", role: "SELLER" },
			{
				sellerOrderId,
				status: "SHIPPED",
				trackingNumber: "TRACK-1",
			},
		);
		expect(shipped).toMatchObject({
			ok: true,
			value: {
				status: "SHIPPED",
				trackingNumber: "TRACK-1",
			},
		});
		await expect(
			db.sellerOrder.findUniqueOrThrow({
				where: { id: sellerOrderId },
				select: {
					status: true,
					trackingNumber: true,
				},
			}),
		).resolves.toEqual({
			status: "SHIPPED",
			trackingNumber: "TRACK-1",
		});
	});

	it("combines duplicate cart rows for the same listing", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 3,
		});
		const useCase = createUseCase(db, new SequentialPurchaseNumberGenerator());

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [
					{ listingId: "listing-1", quantity: 1 },
					{ listingId: "listing-1", quantity: 1 },
				],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error(result.error.message);
		}

		const purchase = await db.purchase.findUniqueOrThrow({
			where: { id: result.value.purchaseId },
			include: {
				sellerOrders: {
					include: {
						items: true,
					},
				},
			},
		});

		expect(await productStock(db, "listing-1")).toBe(1);
		expect(purchase.totalAmountCents).toBe(250_00);
		expect(purchase.sellerOrders).toHaveLength(1);
		expect(purchase.sellerOrders[0]?.items).toHaveLength(1);
		expect(purchase.sellerOrders[0]?.items[0]).toMatchObject({
			listingId: "listing-1",
			quantity: 2,
			unitPriceCents: 125_00,
			subTotalCents: 250_00,
		});
	});

	it("preserves purchase and seller-order history when buyer and seller accounts are deleted", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 1,
		});
		const useCase = createUseCase(db, new SequentialPurchaseNumberGenerator());

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [{ listingId: "listing-1", quantity: 1 }],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
		);

		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error(result.error.message);
		}

		await db.user.delete({
			where: { id: "customer-1" },
		});
		await db.user.delete({
			where: { id: "seller-1" },
		});

		const purchase = await db.purchase.findUniqueOrThrow({
			where: { id: result.value.purchaseId },
			include: {
				sellerOrders: {
					include: {
						items: true,
					},
				},
			},
		});

		expect(purchase).toMatchObject({
			id: result.value.purchaseId,
			customerId: null,
			customerIdSnapshot: "customer-1",
			buyerName: "Pat Buyer",
			buyerEmail: "pat@example.com",
		});
		expect(purchase.sellerOrders).toHaveLength(1);
		expect(purchase.sellerOrders[0]).toMatchObject({
			sellerId: null,
			sellerIdSnapshot: "seller-1",
			subtotalCents: 125_00,
			status: "NEW",
		});
		expect(purchase.sellerOrders[0]?.items).toHaveLength(1);
		expect(purchase.sellerOrders[0]?.items[0]).toMatchObject({
			listingId: "listing-1",
			sellerId: "seller-1",
			sellerDisplayName: "A Seller",
			unitPriceCents: 125_00,
			quantity: 1,
			subTotalCents: 125_00,
		});
	});

	it("rolls back stock and persistence when later notification creation fails", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 1,
		});
		const useCase = createUseCase(
			db,
			new SequentialPurchaseNumberGenerator(),
			new FailingNotificationCreator(),
		);

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			{
				items: [{ listingId: "listing-1", quantity: 1 }],
				buyerName: "Pat Buyer",
				buyerEmail: "pat@example.com",
				buyerPhone: null,
				shippingAddress: "123 Market St",
			},
		);

		expect(result).toEqual({
			ok: false,
			error: expect.objectContaining({
				code: "PLACE_PURCHASE_TRANSACTION_FAILED",
			}),
		});
		expect(await productStock(db, "listing-1")).toBe(1);
		expect(await db.purchase.count()).toBe(0);
		expect(await db.sellerOrder.count()).toBe(0);
		expect(await db.notification.count()).toBe(0);
	});

	it("prevents overselling with concurrent guarded stock mutations", async () => {
		await seedUsers(db);
		await seedProduct(db, {
			id: "listing-1",
			sellerId: "seller-1",
			priceCents: 125_00,
			stock: 1,
		});
		const useCase = createUseCase(db, new SequentialPurchaseNumberGenerator());
		const command = {
			items: [{ listingId: "listing-1", quantity: 1 }],
			buyerName: "Pat Buyer",
			buyerEmail: "pat@example.com",
			buyerPhone: null,
			shippingAddress: "123 Market St",
		};

		const results = await Promise.all([
			useCase.execute({ id: "customer-1", role: "CUSTOMER" }, command),
			useCase.execute({ id: "customer-1", role: "CUSTOMER" }, command),
		]);

		expect(results.filter((result) => result.ok)).toHaveLength(1);
		expect(
			results.filter(
				(result) =>
					!result.ok &&
					result.error.code === "PLACE_PURCHASE_INSUFFICIENT_STOCK",
			),
		).toHaveLength(1);
		expect(await productStock(db, "listing-1")).toBe(0);
		expect(await db.purchase.count()).toBe(1);
		expect(await db.sellerOrder.count()).toBe(1);
	});
});

function createUseCase(
	db: PrismaClient,
	purchaseNumbers: PurchaseNumberGeneratorPort<PrismaTransactionContext>,
	notifications: PurchasePlacedNotificationCreatorPort<PrismaTransactionContext> = new PrismaPurchasePlacedNotificationCreator(),
) {
	return createPrismaPlacePurchase({
		db,
		purchaseNumbers,
		notifications,
	});
}

class SequentialPurchaseNumberGenerator
	implements PurchaseNumberGeneratorPort<PrismaTransactionContext>
{
	private next = 1;

	async generate(_context: PrismaTransactionContext) {
		const value = this.next;
		this.next += 1;

		return `RM-${value}`;
	}
}

class FailingNotificationCreator
	implements PurchasePlacedNotificationCreatorPort<PrismaTransactionContext>
{
	async createForPurchasePlaced(
		_context: PrismaTransactionContext,
		_input: PurchasePlacedNotificationInput,
	) {
		throw new Error("notification creation failed");
	}
}

async function seedUsers(db: PrismaClient) {
	await db.user.createMany({
		data: [
			{
				id: "customer-1",
				email: "customer@example.com",
				firstName: "Pat",
				lastName: "Buyer",
				password: "password",
				role: "CUSTOMER",
			},
			{
				id: "seller-1",
				email: "seller-1@example.com",
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
		sellerId,
		name = "Telecaster",
		priceCents,
		stock,
	}: {
		id: string;
		sellerId: string;
		name?: string;
		priceCents: number;
		stock: number;
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
					url: `https://cdn.example.com/${id}.jpg`,
					publicId: id,
				},
			],
			description: "A test listing",
			price: priceCents / 100,
			priceCents,
			currencyCode: "USD",
			stock,
			isApproved: true,
		},
	});
}

async function productStock(db: PrismaClient, id: string) {
	const product = await db.product.findUniqueOrThrow({
		where: { id },
		select: { stock: true },
	});

	return product.stock;
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
