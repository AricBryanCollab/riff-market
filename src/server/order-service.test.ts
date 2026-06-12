import { describe, expect, it, vi } from "vitest";
import {
	SellerOrder,
	type SellerOrderItemSnapshot,
} from "@/domains/ordering/domain/seller-order";
import type {
	OrderingOrderReadModel,
	OrderingOrderReadStatus,
} from "@/domains/ordering/dto/order-read-model";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	changeSellerOrderStatusForCurrentUser,
	getOrderDetailForCurrentUser,
	listOrdersForCurrentUser,
	OrderRequestError,
	validateChangeSellerOrderStatusInput,
	validateOrderDetailInput,
} from "@/server/order-service";

const sellerUser: ServerUserContext = {
	id: "seller-1",
	email: "seller@example.com",
	firstName: "Sam",
	lastName: "Seller",
	role: "SELLER",
};

const customerUser: ServerUserContext = {
	id: "customer-1",
	email: "customer@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

const adminUser: ServerUserContext = {
	id: "admin-1",
	email: "admin@example.com",
	firstName: "Ada",
	lastName: "Admin",
	role: "ADMIN",
};

describe("order server service", () => {
	it("lists current customer purchases through the ordering read use case", async () => {
		const order = makeOrderReadModel({
			id: "purchase-1",
			status: "OPEN",
		});
		const readModels = {
			listForCustomer: vi.fn().mockResolvedValue([order]),
			listForSeller: vi.fn(),
			listAllForAdmin: vi.fn(),
			findPurchaseForCustomer: vi.fn(),
			findSellerOrderForSeller: vi.fn(),
			findForAdmin: vi.fn(),
		};

		const result = await listOrdersForCurrentUser(customerUser, readModels);

		expect(result).toEqual([order]);
		expect(readModels.listForCustomer).toHaveBeenCalledWith("customer-1");
		expect(readModels.listForSeller).not.toHaveBeenCalled();
	});

	it("lists current seller orders through the seller-order dashboard read use case", async () => {
		const order = makeOrderReadModel({
			id: "seller-order-1",
			sellerOrderId: "seller-order-1",
			status: "NEW",
		});
		const readModels = {
			listForCustomer: vi.fn(),
			listForSeller: vi.fn().mockResolvedValue([order]),
			listAllForAdmin: vi.fn(),
			findPurchaseForCustomer: vi.fn(),
			findSellerOrderForSeller: vi.fn(),
			findForAdmin: vi.fn(),
		};

		const result = await listOrdersForCurrentUser(sellerUser, readModels);

		expect(result).toEqual([order]);
		expect(readModels.listForSeller).toHaveBeenCalledWith("seller-1");
		expect(readModels.listForCustomer).not.toHaveBeenCalled();
	});

	it("lists seller orders for admins", async () => {
		const order = makeOrderReadModel({
			id: "seller-order-1",
			sellerOrderId: "seller-order-1",
			status: "NEW",
		});
		const readModels = {
			listForCustomer: vi.fn(),
			listForSeller: vi.fn(),
			listAllForAdmin: vi.fn().mockResolvedValue([order]),
			findPurchaseForCustomer: vi.fn(),
			findSellerOrderForSeller: vi.fn(),
			findForAdmin: vi.fn(),
		};

		const result = await listOrdersForCurrentUser(adminUser, readModels);

		expect(result).toEqual([order]);
		expect(readModels.listAllForAdmin).toHaveBeenCalledOnce();
		expect(readModels.listForSeller).not.toHaveBeenCalled();
		expect(readModels.listForCustomer).not.toHaveBeenCalled();
	});

	it("reads current customer purchase detail through the ordering detail use case", async () => {
		const order = makeOrderReadModel({
			id: "purchase-1",
			purchaseId: "purchase-1",
			status: "OPEN",
		});
		const readModels = {
			listForCustomer: vi.fn(),
			listForSeller: vi.fn(),
			listAllForAdmin: vi.fn(),
			findPurchaseForCustomer: vi.fn().mockResolvedValue(order),
			findSellerOrderForSeller: vi.fn(),
			findForAdmin: vi.fn(),
		};

		const result = await getOrderDetailForCurrentUser(
			customerUser,
			{ orderId: "purchase-1" },
			readModels,
		);

		expect(result).toEqual(order);
		expect(readModels.findPurchaseForCustomer).toHaveBeenCalledWith(
			"purchase-1",
			"customer-1",
		);
		expect(readModels.findSellerOrderForSeller).not.toHaveBeenCalled();
	});

	it("hides another user's order detail behind not found", async () => {
		const readModels = {
			listForCustomer: vi.fn(),
			listForSeller: vi.fn(),
			listAllForAdmin: vi.fn(),
			findPurchaseForCustomer: vi.fn().mockResolvedValue(null),
			findSellerOrderForSeller: vi.fn(),
			findForAdmin: vi.fn(),
		};

		await expect(
			getOrderDetailForCurrentUser(
				customerUser,
				{ orderId: "purchase-1" },
				readModels,
			),
		).rejects.toMatchObject({
			name: "OrderRequestError",
			status: 404,
			message: "Order not found with the provided order ID",
		});
	});

	it("trims order detail IDs", () => {
		expect(validateOrderDetailInput({ orderId: " purchase-1 " })).toEqual({
			orderId: "purchase-1",
		});
	});

	it("requires order detail IDs", () => {
		expect(() => validateOrderDetailInput({ orderId: " " })).toThrow(
			OrderRequestError,
		);
	});

	it("requires a tracking number before shipping", () => {
		expect(() =>
			validateChangeSellerOrderStatusInput({
				sellerOrderId: "seller-order-1",
				status: "SHIPPED",
				trackingNumber: " ",
			}),
		).toThrow(OrderRequestError);
	});

	it("trims tracking numbers for shipping commands", () => {
		const input = validateChangeSellerOrderStatusInput({
			sellerOrderId: " seller-order-1 ",
			status: "SHIPPED",
			trackingNumber: " TRACK-123 ",
		});

		expect(input).toEqual({
			sellerOrderId: "seller-order-1",
			status: "SHIPPED",
			trackingNumber: "TRACK-123",
		});
	});

	it("changes seller-order status with the current seller actor", async () => {
		const sellerOrder = SellerOrder.reconstitute({
			id: "seller-order-1",
			purchaseId: "purchase-1",
			sellerId: "seller-1",
			status: "NEW",
			trackingNumber: null,
			items: [makeItem()],
		});
		const repository = {
			findById: vi.fn().mockResolvedValue({
				sellerOrder,
				customerId: "customer-1",
			}),
			save: vi.fn().mockResolvedValue(undefined),
		};

		const result = await changeSellerOrderStatusForCurrentUser(
			sellerUser,
			{
				sellerOrderId: "seller-order-1",
				status: "PROCESSING",
			},
			repository,
		);

		expect(result).toEqual({
			sellerOrderId: "seller-order-1",
			purchaseId: "purchase-1",
			status: "PROCESSING",
			trackingNumber: null,
		});
		expect(repository.findById).toHaveBeenCalledWith("seller-order-1");
		expect(repository.save).toHaveBeenCalledWith(sellerOrder, [
			expect.objectContaining({
				eventName: "SellerOrderStatusChanged",
			}),
		]);
	});

	it("ships seller orders with a tracking number", async () => {
		const sellerOrder = SellerOrder.reconstitute({
			id: "seller-order-1",
			purchaseId: "purchase-1",
			sellerId: "seller-1",
			status: "PROCESSING",
			trackingNumber: null,
			items: [makeItem()],
		});
		const repository = {
			findById: vi.fn().mockResolvedValue({
				sellerOrder,
				customerId: "customer-1",
			}),
			save: vi.fn().mockResolvedValue(undefined),
		};

		const result = await changeSellerOrderStatusForCurrentUser(
			sellerUser,
			{
				sellerOrderId: "seller-order-1",
				status: "SHIPPED",
				trackingNumber: "TRACK-123",
			},
			repository,
		);

		expect(result).toEqual({
			sellerOrderId: "seller-order-1",
			purchaseId: "purchase-1",
			status: "SHIPPED",
			trackingNumber: "TRACK-123",
		});
		expect(repository.save).toHaveBeenCalledWith(sellerOrder, [
			expect.objectContaining({
				eventName: "SellerOrderStatusChanged",
				payload: expect.objectContaining({
					previousStatus: "PROCESSING",
					nextStatus: "SHIPPED",
					trackingNumber: "TRACK-123",
				}),
			}),
		]);
	});
});

function makeOrderReadModel(
	overrides: Partial<OrderingOrderReadModel> & {
		status: OrderingOrderReadStatus;
	},
): OrderingOrderReadModel {
	const { status, ...rest } = overrides;

	return {
		id: "order-1",
		purchaseId: "purchase-1",
		orderDate: new Date("2026-06-12T00:00:00.000Z"),
		totalAmount: 125,
		shippingAddress: "123 Market St",
		trackingNumber: "RIFF-1001",
		status,
		items: [],
		...rest,
	};
}

function makeItem(
	overrides: Partial<SellerOrderItemSnapshot> = {},
): SellerOrderItemSnapshot {
	return {
		listingId: "listing-1",
		listingName: "Telecaster",
		brand: "Fender",
		model: "American Standard",
		category: "ELECTRIC",
		condition: "USED",
		primaryImageUrl: "https://cdn.example.com/listing.jpg",
		sellerId: "seller-1",
		sellerDisplayName: "Sam Seller",
		unitPriceCents: 125_00,
		quantity: 1,
		subTotalCents: 125_00,
		currencyCode: "USD",
		...overrides,
	};
}
