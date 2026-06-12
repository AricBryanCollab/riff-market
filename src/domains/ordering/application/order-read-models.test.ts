import { describe, expect, it } from "vitest";

import {
	type BuyerPurchaseHistoryPort,
	deriveBuyerOrderSummaryStatus,
	ListBuyerPurchaseHistory,
	ListSellerOrderDashboard,
	type SellerOrderDashboardPort,
} from "@/domains/ordering/application/order-read-models";
import type { OrderingOrderReadModel } from "@/domains/ordering/dto/order-read-model";

const customerOrder = makeOrderReadModel({ id: "purchase-1" });
const sellerOrder = makeOrderReadModel({
	id: "seller-order-1",
	sellerOrderId: "seller-order-1",
});

describe("ListBuyerPurchaseHistory", () => {
	it("allows customers to read only their own purchase history", async () => {
		const port = new FakeBuyerPurchaseHistoryPort([customerOrder]);
		const useCase = new ListBuyerPurchaseHistory(port);

		const result = await useCase.execute({
			id: "customer-1",
			role: "CUSTOMER",
		});

		expect(result).toEqual({
			ok: true,
			value: [customerOrder],
		});
		expect(port.requestedCustomerIds).toEqual(["customer-1"]);
	});

	it("rejects non-customer purchase history reads", async () => {
		const port = new FakeBuyerPurchaseHistoryPort([customerOrder]);
		const useCase = new ListBuyerPurchaseHistory(port);

		const result = await useCase.execute({
			id: "seller-1",
			role: "SELLER",
		});

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_READ_UNAUTHORIZED",
				kind: "authorization",
			},
		});
		expect(port.requestedCustomerIds).toEqual([]);
	});
});

describe("ListSellerOrderDashboard", () => {
	it("allows sellers to read their seller orders", async () => {
		const port = new FakeSellerOrderDashboardPort([sellerOrder]);
		const useCase = new ListSellerOrderDashboard(port);

		const result = await useCase.execute({
			id: "seller-1",
			role: "SELLER",
		});

		expect(result).toEqual({
			ok: true,
			value: [sellerOrder],
		});
		expect(port.requestedSellerIds).toEqual(["seller-1"]);
		expect(port.adminReadCount).toBe(0);
	});

	it("allows admins to read all seller orders", async () => {
		const port = new FakeSellerOrderDashboardPort([sellerOrder]);
		const useCase = new ListSellerOrderDashboard(port);

		const result = await useCase.execute({
			id: "admin-1",
			role: "ADMIN",
		});

		expect(result).toEqual({
			ok: true,
			value: [sellerOrder],
		});
		expect(port.requestedSellerIds).toEqual([]);
		expect(port.adminReadCount).toBe(1);
	});

	it("rejects customer seller-order dashboard reads", async () => {
		const port = new FakeSellerOrderDashboardPort([sellerOrder]);
		const useCase = new ListSellerOrderDashboard(port);

		const result = await useCase.execute({
			id: "customer-1",
			role: "CUSTOMER",
		});

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_READ_UNAUTHORIZED",
				kind: "authorization",
			},
		});
		expect(port.requestedSellerIds).toEqual([]);
		expect(port.adminReadCount).toBe(0);
	});
});

describe("deriveBuyerOrderSummaryStatus", () => {
	it.each([
		{
			paymentStatus: "PENDING_PAYMENT" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["NEW"] as const,
			expected: "PENDING_PAYMENT",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["NEW", "PROCESSING"] as const,
			expected: "OPEN",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["SHIPPED", "NEW"] as const,
			expected: "PARTIALLY_SHIPPED",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["SHIPPED", "DELIVERED"] as const,
			expected: "SHIPPED",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["DELIVERED", "DELIVERED"] as const,
			expected: "DELIVERED",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["CANCELED", "NEW"] as const,
			expected: "PARTIALLY_CANCELED",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "OPEN" as const,
			sellerOrderStatuses: ["CANCELED", "CANCELED"] as const,
			expected: "CANCELED",
		},
		{
			paymentStatus: "MANUALLY_CONFIRMED" as const,
			purchaseStatus: "CANCELED" as const,
			sellerOrderStatuses: ["NEW"] as const,
			expected: "CANCELED",
		},
	])("derives $expected from purchase/payment/seller-order state", ({
		expected,
		...input
	}) => {
		expect(deriveBuyerOrderSummaryStatus(input)).toBe(expected);
	});
});

class FakeBuyerPurchaseHistoryPort implements BuyerPurchaseHistoryPort {
	readonly requestedCustomerIds: string[] = [];

	constructor(private readonly orders: OrderingOrderReadModel[]) {}

	async listForCustomer(customerId: string) {
		this.requestedCustomerIds.push(customerId);

		return this.orders;
	}
}

class FakeSellerOrderDashboardPort implements SellerOrderDashboardPort {
	readonly requestedSellerIds: string[] = [];
	adminReadCount = 0;

	constructor(private readonly orders: OrderingOrderReadModel[]) {}

	async listForSeller(sellerId: string) {
		this.requestedSellerIds.push(sellerId);

		return this.orders;
	}

	async listAllForAdmin() {
		this.adminReadCount += 1;

		return this.orders;
	}
}

function makeOrderReadModel(
	overrides: Partial<OrderingOrderReadModel> = {},
): OrderingOrderReadModel {
	return {
		id: "purchase-1",
		purchaseId: "purchase-1",
		orderDate: new Date("2026-06-12T00:00:00.000Z"),
		totalAmount: 1299,
		shippingAddress: "123 Main St",
		trackingNumber: "RM-1001",
		status: "OPEN",
		items: [],
		...overrides,
	};
}
