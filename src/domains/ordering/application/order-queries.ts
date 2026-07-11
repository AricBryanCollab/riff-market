import type {
	PaymentStatus,
	PurchaseStatus,
} from "@/domains/ordering/domain/purchase";
import type { SellerOrderStatus } from "@/domains/ordering/domain/seller-order";
import type {
	BuyerOrderSummaryStatus,
	BuyerPurchaseView,
	OrderView,
	SellerOrderView,
} from "@/domains/ordering/dto/order-view";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type OrderQueryErrorCode =
	| "ORDER_QUERY_UNAUTHORIZED"
	| "ORDER_QUERY_NOT_FOUND";

export type OrderQueryError = AppError<OrderQueryErrorCode>;

export interface BuyerPurchaseHistoryPort {
	listForCustomer(customerId: string): Promise<BuyerPurchaseView[]>;
}

export interface SellerOrderDashboardPort {
	listForSeller(sellerId: string): Promise<SellerOrderView[]>;
	listAllForAdmin(): Promise<SellerOrderView[]>;
}

export interface OrderDetailQueryPort {
	findPurchaseForCustomer(
		purchaseId: string,
		customerId: string,
	): Promise<BuyerPurchaseView | null>;
	findSellerOrderForSeller(
		sellerOrderId: string,
		sellerId: string,
	): Promise<SellerOrderView | null>;
	findForAdmin(orderId: string): Promise<OrderView | null>;
}

export async function listBuyerPurchaseHistory(
	actor: Actor,
	purchases: BuyerPurchaseHistoryPort,
): Promise<Result<BuyerPurchaseView[], OrderQueryError>> {
	if (actor.role !== "CUSTOMER") {
		return err(
			orderQueryError(
				"ORDER_QUERY_UNAUTHORIZED",
				"Only customers can read purchase history",
			),
		);
	}

	return ok(await purchases.listForCustomer(actor.id));
}

export async function listSellerOrderDashboard(
	actor: Actor,
	sellerOrders: SellerOrderDashboardPort,
): Promise<Result<SellerOrderView[], OrderQueryError>> {
	if (actor.role !== "SELLER" && actor.role !== "ADMIN") {
		return err(
			orderQueryError(
				"ORDER_QUERY_UNAUTHORIZED",
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
	orderDetails: OrderDetailQueryPort,
): Promise<Result<OrderView, OrderQueryError>> {
	const order = await findAuthorizedOrder(actor, orderId, orderDetails);
	if (!order) {
		return err(
			orderQueryError(
				"ORDER_QUERY_NOT_FOUND",
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
	orderDetails: OrderDetailQueryPort,
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

function orderQueryError(
	code: OrderQueryErrorCode,
	message: string,
	kind: OrderQueryError["kind"] = "authorization",
): OrderQueryError {
	return {
		code,
		message,
		kind,
	};
}
