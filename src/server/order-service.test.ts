import { describe, expect, it } from "vitest";
import type { SellerOrderStatusRepositoryPort } from "@/domains/ordering/application/change-seller-order-status";
import type { OrderingOrderReadModel } from "@/domains/ordering/dto/order-read-model";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	changeSellerOrderStatusForCurrentUser,
	getOrderDetailForCurrentUser,
	OrderRequestError,
	validateChangeSellerOrderStatusInput,
	validateOrderDetailInput,
} from "@/server/order-service";

type OrderReadModels = NonNullable<
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
			OrderRequestError,
		);
	});

	it("maps missing order detail reads into request errors", async () => {
		await expect(
			getOrderDetailForCurrentUser(
				customerUser,
				{ orderId: "missing-order" },
				new EmptyOrderReadModels(),
			),
		).rejects.toMatchObject({
			name: "OrderRequestError",
			status: 404,
			message: "Order not found with the provided order ID",
		});
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
			name: "OrderRequestError",
			code: "CHANGE_SELLER_ORDER_STATUS_NOT_FOUND",
			status: 404,
		});
	});
});

class EmptyOrderReadModels implements OrderReadModels {
	async listForCustomer() {
		return [];
	}

	async listForSeller() {
		return [];
	}

	async listAllForAdmin() {
		return [];
	}

	async findPurchaseForCustomer(): Promise<OrderingOrderReadModel | null> {
		return null;
	}

	async findSellerOrderForSeller(): Promise<OrderingOrderReadModel | null> {
		return null;
	}

	async findForAdmin(): Promise<OrderingOrderReadModel | null> {
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
