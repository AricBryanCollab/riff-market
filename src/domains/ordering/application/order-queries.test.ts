import { describe, expect, it } from "vitest";

import {
	type BuyerPurchaseHistoryPort,
	deriveBuyerOrderSummaryStatus,
	getOrderDetail,
	listBuyerPurchaseHistory,
	listSellerOrderDashboard,
	type OrderDetailQueryPort,
	type SellerOrderDashboardPort,
} from "@/domains/ordering/application/order-queries";
import type {
	BuyerPurchaseView,
	OrderView,
	SellerOrderView,
} from "@/domains/ordering/dto/order-view";

const customerOrder = makeBuyerPurchaseView({ id: "purchase-1" });
const sellerOrder = makeSellerOrderView({ id: "seller-order-1" });

describe("listBuyerPurchaseHistory", () => {
	it("allows customers to read only their own purchase history", async () => {
		const port = new FakeBuyerPurchaseHistoryPort([customerOrder]);

		const result = await listBuyerPurchaseHistory(
			{
				id: "customer-1",
				role: "CUSTOMER",
			},
			port,
		);

		expect(result).toEqual({
			ok: true,
			value: [customerOrder],
		});
		expect(port.requestedCustomerIds).toEqual(["customer-1"]);
	});

	it("rejects non-customer purchase history reads", async () => {
		const port = new FakeBuyerPurchaseHistoryPort([customerOrder]);

		const result = await listBuyerPurchaseHistory(
			{
				id: "seller-1",
				role: "SELLER",
			},
			port,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_QUERY_UNAUTHORIZED",
				kind: "authorization",
			},
		});
		expect(port.requestedCustomerIds).toEqual([]);
	});
});

describe("listSellerOrderDashboard", () => {
	it("allows sellers to read their seller orders", async () => {
		const port = new FakeSellerOrderDashboardPort([sellerOrder]);

		const result = await listSellerOrderDashboard(
			{
				id: "seller-1",
				role: "SELLER",
			},
			port,
		);

		expect(result).toEqual({
			ok: true,
			value: [sellerOrder],
		});
		expect(port.requestedSellerIds).toEqual(["seller-1"]);
		expect(port.adminReadCount).toBe(0);
	});

	it("allows admins to read all seller orders", async () => {
		const port = new FakeSellerOrderDashboardPort([sellerOrder]);

		const result = await listSellerOrderDashboard(
			{
				id: "admin-1",
				role: "ADMIN",
			},
			port,
		);

		expect(result).toEqual({
			ok: true,
			value: [sellerOrder],
		});
		expect(port.requestedSellerIds).toEqual([]);
		expect(port.adminReadCount).toBe(1);
	});

	it("rejects customer seller-order dashboard reads", async () => {
		const port = new FakeSellerOrderDashboardPort([sellerOrder]);

		const result = await listSellerOrderDashboard(
			{
				id: "customer-1",
				role: "CUSTOMER",
			},
			port,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_QUERY_UNAUTHORIZED",
				kind: "authorization",
			},
		});
		expect(port.requestedSellerIds).toEqual([]);
		expect(port.adminReadCount).toBe(0);
	});
});

describe("getOrderDetail", () => {
	it("allows customers to read their own purchase detail", async () => {
		const port = new FakeOrderDetailQueryPort({
			customerPurchase: customerOrder,
		});

		const result = await getOrderDetail(
			{ id: "customer-1", role: "CUSTOMER" },
			"purchase-1",
			port,
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
		const port = new FakeOrderDetailQueryPort({
			customerPurchase: null,
		});

		const result = await getOrderDetail(
			{ id: "customer-1", role: "CUSTOMER" },
			"purchase-2",
			port,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "ORDER_QUERY_NOT_FOUND",
				kind: "not-found",
			},
		});
	});

	it("allows sellers to read their own seller-order detail", async () => {
		const port = new FakeOrderDetailQueryPort({
			sellerOrder,
		});

		const result = await getOrderDetail(
			{ id: "seller-1", role: "SELLER" },
			"seller-order-1",
			port,
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
		const port = new FakeOrderDetailQueryPort({
			adminOrder: sellerOrder,
		});

		const result = await getOrderDetail(
			{ id: "admin-1", role: "ADMIN" },
			"seller-order-1",
			port,
		);

		expect(result).toEqual({
			ok: true,
			value: sellerOrder,
		});
		expect(port.requests).toEqual([["findForAdmin", "seller-order-1"]]);
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

	constructor(private readonly orders: BuyerPurchaseView[]) {}

	async listForCustomer(customerId: string) {
		this.requestedCustomerIds.push(customerId);

		return this.orders;
	}
}

class FakeSellerOrderDashboardPort implements SellerOrderDashboardPort {
	readonly requestedSellerIds: string[] = [];
	adminReadCount = 0;

	constructor(private readonly orders: SellerOrderView[]) {}

	async listForSeller(sellerId: string) {
		this.requestedSellerIds.push(sellerId);

		return this.orders;
	}

	async listAllForAdmin() {
		this.adminReadCount += 1;

		return this.orders;
	}
}

class FakeOrderDetailQueryPort implements OrderDetailQueryPort {
	readonly requests: unknown[][] = [];

	constructor(
		private readonly orders: {
			readonly customerPurchase?: BuyerPurchaseView | null;
			readonly sellerOrder?: SellerOrderView | null;
			readonly adminOrder?: OrderView | null;
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

function makeBuyerPurchaseView(
	overrides: Partial<BuyerPurchaseView> = {},
): BuyerPurchaseView {
	return {
		kind: "buyer-purchase",
		id: "purchase-1",
		purchaseId: "purchase-1",
		orderDate: new Date("2026-06-12T00:00:00.000Z"),
		totalAmountMinor: 1299,
		currencyCode: "TWD",
		shippingAddress: "123 Main St",
		trackingNumber: "RM-1001",
		status: "OPEN",
		items: [],
		...overrides,
	};
}

function makeSellerOrderView(
	overrides: Partial<SellerOrderView> = {},
): SellerOrderView {
	return {
		kind: "seller-order",
		id: "seller-order-1",
		purchaseId: "purchase-1",
		sellerOrderId: "seller-order-1",
		orderDate: new Date("2026-06-12T00:00:00.000Z"),
		totalAmountMinor: 1299,
		currencyCode: "TWD",
		shippingAddress: "123 Main St",
		trackingNumber: "TRACK-1001",
		status: "NEW",
		allowedStatusCommands: ["PROCESSING", "CANCELED"],
		items: [],
		customer: {
			id: "customer-1",
			email: "customer@example.com",
			firstName: "Pat",
			lastName: "Buyer",
		},
		...overrides,
	};
}
