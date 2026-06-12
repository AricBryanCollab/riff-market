import type {
	PaymentStatus,
	PurchaseStatus,
} from "@/domains/ordering/domain/purchase";
import type { SellerOrderStatus } from "@/domains/ordering/domain/seller-order";
import type {
	OrderingOrderReadModel,
	OrderingOrderReadStatus,
} from "@/domains/ordering/dto/order-read-model";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	appError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type OrderReadErrorCode = "ORDER_READ_UNAUTHORIZED";

export type OrderReadError = AppError<OrderReadErrorCode>;

export interface BuyerPurchaseHistoryPort {
	listForCustomer(customerId: string): Promise<OrderingOrderReadModel[]>;
}

export interface SellerOrderDashboardPort {
	listForSeller(sellerId: string): Promise<OrderingOrderReadModel[]>;
	listAllForAdmin(): Promise<OrderingOrderReadModel[]>;
}

export class ListBuyerPurchaseHistory {
	constructor(private readonly purchases: BuyerPurchaseHistoryPort) {}

	async execute(
		actor: Actor,
	): Promise<Result<OrderingOrderReadModel[], OrderReadError>> {
		if (actor.role !== "CUSTOMER") {
			return err(
				orderReadError(
					"ORDER_READ_UNAUTHORIZED",
					"Only customers can read purchase history",
				),
			);
		}

		return ok(await this.purchases.listForCustomer(actor.id));
	}
}

export class ListSellerOrderDashboard {
	constructor(private readonly sellerOrders: SellerOrderDashboardPort) {}

	async execute(
		actor: Actor,
	): Promise<Result<OrderingOrderReadModel[], OrderReadError>> {
		if (actor.role !== "SELLER" && actor.role !== "ADMIN") {
			return err(
				orderReadError(
					"ORDER_READ_UNAUTHORIZED",
					"Only sellers and admins can read seller orders",
				),
			);
		}

		if (actor.role === "ADMIN") {
			return ok(await this.sellerOrders.listAllForAdmin());
		}

		return ok(await this.sellerOrders.listForSeller(actor.id));
	}
}

export function deriveBuyerOrderSummaryStatus(input: {
	readonly purchaseStatus: PurchaseStatus;
	readonly paymentStatus: PaymentStatus;
	readonly sellerOrderStatuses: readonly SellerOrderStatus[];
}): OrderingOrderReadStatus {
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
): OrderReadError {
	return appError({
		code,
		message,
		kind: "authorization",
	});
}
