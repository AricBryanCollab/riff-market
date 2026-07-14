import { describe, expect, it } from "vitest";
import type { SellerOrderStatusRepositoryPort } from "@/domains/ordering/application/change-seller-order-status";
import type {
	BuyerPurchaseView,
	OrderView,
	SellerOrderView,
} from "@/domains/ordering/dto/order-view";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	changeSellerOrderStatusForCurrentUser,
	getOrderDetailForCurrentUser,
	validateChangeSellerOrderStatusInput,
	validateOrderDetailInput,
} from "@/server/order-service";
import { RequestError } from "@/server/request-error";

type OrderQueries = NonNullable<
	Parameters<typeof getOrderDetailForCurrentUser>[2]
>;

const customerUser: ServerUserContext = {
	id: "customer-1",
	email: "customer@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

const sellerUser: ServerUserContext = {
	id: "seller-1",
	email: "seller@example.com",
	firstName: "Sam",
	lastName: "Seller",
	role: "SELLER",
};

describe("order server service", () => {
	it("trims order detail IDs", () => {
		expect(validateOrderDetailInput({ orderId: " purchase-1 " })).toEqual({
			orderId: "purchase-1",
		});
	});

	it("requires order detail IDs", () => {
		expect(() => validateOrderDetailInput({ orderId: " " })).toThrow(
			RequestError,
		);
	});

	it("maps missing order detail reads into request errors", async () => {
		await expect(
			getOrderDetailForCurrentUser(
				customerUser,
				{ orderId: "missing-order" },
				new EmptyOrderQueries(),
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 404,
			message: "Order not found with the provided order ID",
		});
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

	it("maps missing tracking numbers for shipping into request errors", async () => {
		await expect(
			changeSellerOrderStatusForCurrentUser(
				sellerUser,
				{
					sellerOrderId: "seller-order-1",
					status: "SHIPPED",
				},
				new MissingSellerOrderStatusRepository(),
			),
		).rejects.toMatchObject({
			name: "RequestError",
			code: "CHANGE_SELLER_ORDER_STATUS_INVALID_COMMAND",
			message: "Tracking number is required to ship seller order",
		});
	});

	it("maps missing seller-order status targets into request errors", async () => {
		await expect(
			changeSellerOrderStatusForCurrentUser(
				sellerUser,
				{
					sellerOrderId: "missing-seller-order",
					status: "PROCESSING",
				},
				new MissingSellerOrderStatusRepository(),
			),
		).rejects.toMatchObject({
			name: "RequestError",
			code: "CHANGE_SELLER_ORDER_STATUS_NOT_FOUND",
			status: 404,
		});
	});
});

class EmptyOrderQueries implements OrderQueries {
	async findPurchaseForCustomer(): Promise<BuyerPurchaseView | null> {
		return null;
	}

	async findSellerOrderForSeller(): Promise<SellerOrderView | null> {
		return null;
	}

	async findForAdmin(): Promise<OrderView | null> {
		return null;
	}
}

class MissingSellerOrderStatusRepository
	implements SellerOrderStatusRepositoryPort
{
	async findById() {
		return null;
	}

	async save() {
		throw new Error("Missing seller orders cannot be saved");
	}
}
