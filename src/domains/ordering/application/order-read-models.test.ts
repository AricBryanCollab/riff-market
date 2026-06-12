import { describe, expect, it } from "vitest";

import {
	type BuyerPurchaseHistoryPort,
	deriveBuyerOrderSummaryStatus,
	GetOrderDetail,
	ListBuyerPurchaseHistory,
	ListSellerOrderDashboard,
	type OrderDetailReadPort,
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

describe("GetOrderDetail", () => {
	it("allows customers to read their own purchase detail", async () => {
		const port = new FakeOrderDetailReadPort({
			customerPurchase: customerOrder,
		});
		const useCase = new GetOrderDetail(port);

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			"purchase-1",
		);

		expect(result).toEqual({
			ok: true,
			value: customerOrder,
		});
		expect(port.requests).toEqual([
			["findPurchaseForCustomer", "purchase-1", "customer-1"],
		]);
	});

	it("returns not found when a customer reads another customer's purchase", async () => {
		const port = new FakeOrderDetailReadPort({
			customerPurchase: null,
		});
		const useCase = new GetOrderDetail(port);

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			"purchase-2",
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_READ_NOT_FOUND",
				kind: "not-found",
			},
		});
	});

	it("allows sellers to read their own seller-order detail", async () => {
		const port = new FakeOrderDetailReadPort({
			sellerOrder,
		});
		const useCase = new GetOrderDetail(port);

		const result = await useCase.execute(
			{ id: "seller-1", role: "SELLER" },
			"seller-order-1",
		);

		expect(result).toEqual({
			ok: true,
			value: sellerOrder,
		});
		expect(port.requests).toEqual([
			["findSellerOrderForSeller", "seller-order-1", "seller-1"],
		]);
	});

	it("allows admins to read either purchase or seller-order detail", async () => {
		const port = new FakeOrderDetailReadPort({
			adminOrder: sellerOrder,
		});
		const useCase = new GetOrderDetail(port);

		const result = await useCase.execute(
			{ id: "admin-1", role: "ADMIN" },
			"seller-order-1",
		);

		expect(result).toEqual({
			ok: true,
			value: sellerOrder,
		});
		expect(port.requests).toEqual([["findForAdmin", "seller-order-1"]]);
	});

	it("rejects blank order IDs", async () => {
		const port = new FakeOrderDetailReadPort({});
		const useCase = new GetOrderDetail(port);

		const result = await useCase.execute(
			{ id: "customer-1", role: "CUSTOMER" },
			" ",
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_READ_INVALID_ID",
				kind: "validation",
			},
		});
		expect(port.requests).toEqual([]);
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

class FakeOrderDetailReadPort implements OrderDetailReadPort {
	readonly requests: unknown[][] = [];

	constructor(
		private readonly orders: {
			readonly customerPurchase?: OrderingOrderReadModel | null;
			readonly sellerOrder?: OrderingOrderReadModel | null;
			readonly adminOrder?: OrderingOrderReadModel | null;
		},
	) {}

	async findPurchaseForCustomer(purchaseId: string, customerId: string) {
		this.requests.push(["findPurchaseForCustomer", purchaseId, customerId]);

		return this.orders.customerPurchase ?? null;
	}

	async findSellerOrderForSeller(sellerOrderId: string, sellerId: string) {
		this.requests.push(["findSellerOrderForSeller", sellerOrderId, sellerId]);

		return this.orders.sellerOrder ?? null;
	}

	async findForAdmin(orderId: string) {
		this.requests.push(["findForAdmin", orderId]);

		return this.orders.adminOrder ?? null;
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
