import type {
	PaymentStatus,
	PurchaseStatus,
} from "@/domains/ordering/domain/purchase";
import type { SellerOrderStatus } from "@/domains/ordering/domain/seller-order";
import type {
	BuyerOrderSummaryStatus,
	BuyerPurchaseReadModel,
	OrderingOrderReadModel,
	SellerOrderReadModel,
} from "@/domains/ordering/dto/order-read-model";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type OrderReadErrorCode =
	| "ORDER_READ_UNAUTHORIZED"
	| "ORDER_READ_INVALID_ID"
	| "ORDER_READ_NOT_FOUND";

export type OrderReadError = AppError<OrderReadErrorCode>;

export interface BuyerPurchaseHistoryPort {
	listForCustomer(customerId: string): Promise<BuyerPurchaseReadModel[]>;
}

export interface SellerOrderDashboardPort {
	listForSeller(sellerId: string): Promise<SellerOrderReadModel[]>;
	listAllForAdmin(): Promise<SellerOrderReadModel[]>;
}

export interface OrderDetailReadPort {
	findPurchaseForCustomer(
		purchaseId: string,
		customerId: string,
	): Promise<BuyerPurchaseReadModel | null>;
	findSellerOrderForSeller(
		sellerOrderId: string,
		sellerId: string,
	): Promise<SellerOrderReadModel | null>;
	findForAdmin(orderId: string): Promise<OrderingOrderReadModel | null>;
}

export async function listBuyerPurchaseHistory(
	actor: Actor,
	purchases: BuyerPurchaseHistoryPort,
): Promise<Result<BuyerPurchaseReadModel[], OrderReadError>> {
	if (actor.role !== "CUSTOMER") {
		return err(
			orderReadError(
				"ORDER_READ_UNAUTHORIZED",
				"Only customers can read purchase history",
			),
		);
	}

	return ok(await purchases.listForCustomer(actor.id));
}

export async function listSellerOrderDashboard(
	actor: Actor,
	sellerOrders: SellerOrderDashboardPort,
): Promise<Result<SellerOrderReadModel[], OrderReadError>> {
	if (actor.role !== "SELLER" && actor.role !== "ADMIN") {
		return err(
			orderReadError(
				"ORDER_READ_UNAUTHORIZED",
				"Only sellers and admins can read seller orders",
			),
		);
	}

	if (actor.role === "ADMIN") {
		return ok(await sellerOrders.listAllForAdmin());
	}

	return ok(await sellerOrders.listForSeller(actor.id));
}

export async function getOrderDetail(
	actor: Actor,
	orderId: string,
	orderDetails: OrderDetailReadPort,
): Promise<Result<OrderingOrderReadModel, OrderReadError>> {
	if (orderId.trim().length === 0) {
		return err(
			orderReadError(
				"ORDER_READ_INVALID_ID",
				"Order ID is required",
				"validation",
			),
		);
	}

	const order = await findAuthorizedOrder(actor, orderId, orderDetails);
	if (!order) {
		return err(
			orderReadError(
				"ORDER_READ_NOT_FOUND",
				"Order not found with the provided order ID",
				"not-found",
			),
		);
	}

	return ok(order);
}

function findAuthorizedOrder(
	actor: Actor,
	orderId: string,
	orderDetails: OrderDetailReadPort,
) {
	switch (actor.role) {
		case "CUSTOMER":
			return orderDetails.findPurchaseForCustomer(orderId, actor.id);
		case "SELLER":
			return orderDetails.findSellerOrderForSeller(orderId, actor.id);
		case "ADMIN":
			return orderDetails.findForAdmin(orderId);
	}
}

export function deriveBuyerOrderSummaryStatus(input: {
	readonly purchaseStatus: PurchaseStatus;
	readonly paymentStatus: PaymentStatus;
	readonly sellerOrderStatuses: readonly SellerOrderStatus[];
}): BuyerOrderSummaryStatus {
	if (input.paymentStatus === "PENDING_PAYMENT") {
		return "PENDING_PAYMENT";
	}

	if (input.purchaseStatus === "CANCELED") {
		return "CANCELED";
	}

	const statuses = input.sellerOrderStatuses;
	if (statuses.length === 0) {
		return "OPEN";
	}

	if (statuses.every((status) => status === "CANCELED")) {
		return "CANCELED";
	}

	if (statuses.some((status) => status === "CANCELED")) {
		return "PARTIALLY_CANCELED";
	}

	if (statuses.every((status) => status === "DELIVERED")) {
		return "DELIVERED";
	}

	if (
		statuses.every((status) => status === "SHIPPED" || status === "DELIVERED")
	) {
		return "SHIPPED";
	}

	if (
		statuses.some((status) => status === "SHIPPED" || status === "DELIVERED")
	) {
		return "PARTIALLY_SHIPPED";
	}

	return "OPEN";
}

function orderReadError(
	code: OrderReadErrorCode,
	message: string,
	kind: OrderReadError["kind"] = "authorization",
): OrderReadError {
	return {
		code,
		message,
		kind,
	};
}
