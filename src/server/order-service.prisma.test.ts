import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import { PrismaOrderReadModels } from "@/domains/ordering/infrastructure/prisma-order-read-models";
import { PrismaSellerOrderStatusRepository } from "@/domains/ordering/infrastructure/prisma-seller-order-status-repository";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	changeSellerOrderStatusForCurrentUser,
	getOrderDetailForCurrentUser,
	listOrdersForCurrentUser,
} from "@/server/order-service";
import {
	describeDb,
	seedMarketplaceUsers,
	seedPurchaseWithSellerOrders,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";

const customerUser: ServerUserContext = {
	id: "customer-1",
	email: "customer@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

const sellerUser: ServerUserContext = {
	id: "seller-1",
	email: "seller-1@example.com",
	firstName: "A",
	lastName: "Seller",
	role: "SELLER",
};

const sellerTwoUser: ServerUserContext = {
	id: "seller-2",
	email: "seller-2@example.com",
	firstName: "B",
	lastName: "Seller",
	role: "SELLER",
};

const adminUser: ServerUserContext = {
	id: "admin-1",
	email: "admin@example.com",
	firstName: "Admin",
	lastName: "User",
	role: "ADMIN",
};

describeDb("order service Prisma integration", () => {
	let db: PrismaClient;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		await seedMarketplaceUsers(db);
	});

	it("serves persisted purchases and seller orders by current-user role", async () => {
		await seedOrderServicePurchase(db);
		const readModels = new PrismaOrderReadModels(db);

		const customerOrders = await listOrdersForCurrentUser(
			customerUser,
			readModels,
		);
		expect(customerOrders).toMatchObject([
			{
				id: "purchase-1",
				purchaseId: "purchase-1",
				totalAmountMinor: 275,
				currencyCode: "TWD",
				status: "OPEN",
			},
		]);

		const sellerOrders = await listOrdersForCurrentUser(sellerUser, readModels);
		expect(sellerOrders).toMatchObject([
			{
				id: "seller-order-1",
				sellerOrderId: "seller-order-1",
				totalAmountMinor: 125,
				currencyCode: "TWD",
				status: "NEW",
			},
		]);

		const adminOrders = await listOrdersForCurrentUser(adminUser, readModels);
		expect(adminOrders.map((order) => order.id).sort()).toEqual([
			"seller-order-1",
			"seller-order-2",
		]);

		const customerDetail = await getOrderDetailForCurrentUser(
			customerUser,
			{ orderId: "purchase-1" },
			readModels,
		);
		expect(customerDetail).toMatchObject({
			id: "purchase-1",
			totalAmountMinor: 275,
			currencyCode: "TWD",
			items: expect.arrayContaining([
				expect.objectContaining({
					listingId: "listing-1",
					quantity: 1,
					unitPriceAmountMinor: 125,
					subTotalAmountMinor: 125,
					currencyCode: "TWD",
				}),
				expect.objectContaining({
					listingId: "listing-2",
					quantity: 2,
					unitPriceAmountMinor: 75,
					subTotalAmountMinor: 150,
					currencyCode: "TWD",
				}),
			]),
		});

		await expect(
			getOrderDetailForCurrentUser(
				sellerUser,
				{ orderId: "seller-order-2" },
				readModels,
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 404,
			message: "Order not found with the provided order ID",
		});

		const sellerDetail = await getOrderDetailForCurrentUser(
			sellerUser,
			{ orderId: "seller-order-1" },
			readModels,
		);
		expect(sellerDetail).toMatchObject({
			id: "seller-order-1",
			sellerOrderId: "seller-order-1",
			totalAmountMinor: 125,
			currencyCode: "TWD",
			status: "NEW",
			customer: {
				id: "customer-1",
				email: "customer@example.com",
				firstName: "Pat",
				lastName: "Buyer",
			},
		});

		const adminDetail = await getOrderDetailForCurrentUser(
			adminUser,
			{ orderId: "seller-order-2" },
			readModels,
		);
		expect(adminDetail).toMatchObject({
			id: "seller-order-2",
			sellerOrderId: "seller-order-2",
			totalAmountMinor: 150,
			currencyCode: "TWD",
			status: "NEW",
		});
	});

	it("persists seller-order status changes by current-user command", async () => {
		await seedOrderServicePurchase(db);
		const sellerOrders = new PrismaSellerOrderStatusRepository(db);

		await expect(
			changeSellerOrderStatusForCurrentUser(
				sellerTwoUser,
				{ sellerOrderId: "seller-order-1", status: "PROCESSING" },
				sellerOrders,
			),
		).rejects.toMatchObject({
			name: "RequestError",
			code: "CHANGE_SELLER_ORDER_STATUS_UNAUTHORIZED",
			status: 403,
		});
		await expect(sellerOrderStatus(db, "seller-order-1")).resolves.toEqual({
			status: "NEW",
			trackingNumber: null,
		});

		const processed = await changeSellerOrderStatusForCurrentUser(
			sellerUser,
			{ sellerOrderId: "seller-order-1", status: "PROCESSING" },
			sellerOrders,
		);
		expect(processed).toEqual({
			sellerOrderId: "seller-order-1",
			purchaseId: "purchase-1",
			status: "PROCESSING",
			trackingNumber: null,
		});

		const shipped = await changeSellerOrderStatusForCurrentUser(
			sellerUser,
			{
				sellerOrderId: "seller-order-1",
				status: "SHIPPED",
				trackingNumber: "TRACK-1",
			},
			sellerOrders,
		);
		expect(shipped).toEqual({
			sellerOrderId: "seller-order-1",
			purchaseId: "purchase-1",
			status: "SHIPPED",
			trackingNumber: "TRACK-1",
		});

		await expect(
			db.sellerOrder.findUniqueOrThrow({
				where: { id: "seller-order-1" },
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
});

async function sellerOrderStatus(db: PrismaClient, sellerOrderId: string) {
	return db.sellerOrder.findUniqueOrThrow({
		where: { id: sellerOrderId },
		select: {
			status: true,
			trackingNumber: true,
		},
	});
}

async function seedOrderServicePurchase(db: PrismaClient) {
	await seedPurchaseWithSellerOrders(db, {
		id: "purchase-1",
		totalAmountCents: 275,
		sellerOrders: [
			{
				id: "seller-order-1",
				sellerId: "seller-1",
				sellerIdSnapshot: "seller-1",
				subtotalCents: 125,
				items: [
					{
						id: "seller-order-item-1",
						listingId: "listing-1",
						sellerId: "seller-1",
						sellerDisplayName: "A Seller",
						unitPriceCents: 125,
						quantity: 1,
					},
				],
			},
			{
				id: "seller-order-2",
				sellerId: "seller-2",
				sellerIdSnapshot: "seller-2",
				subtotalCents: 150,
				items: [
					{
						id: "seller-order-item-2",
						listingId: "listing-2",
						listingName: "Jazzmaster",
						sellerId: "seller-2",
						sellerDisplayName: "B Seller",
						unitPriceCents: 75,
						quantity: 2,
					},
				],
			},
		],
	});
}
