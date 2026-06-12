import {
	changeSellerOrderStatusFn,
	getOrderDetailFn,
	listOrdersForCurrentUserFn,
	placePurchaseFn,
} from "@/server/order.functions";
import type { PlacePurchaseResponse } from "@/server/place-purchase-service";
import type { OrderStatus } from "@/types/enum";
import type {
	GetUserOrdersErrorResponse,
	OrderRequest,
	OrderResponse,
} from "@/types/order";

export function createOrder(
	data: OrderRequest,
): Promise<PlacePurchaseResponse> {
	return placePurchaseFn({ data });
}

export function getOrderByCustomer() {
	return listOrdersForCurrentUserFn() as Promise<
		OrderResponse[] | GetUserOrdersErrorResponse
	>;
}

export function getOrderBySeller() {
	return listOrdersForCurrentUserFn() as Promise<
		OrderResponse[] | GetUserOrdersErrorResponse
	>;
}

export function getOrderById(id: string) {
	return getOrderDetailFn({ data: { orderId: id } }) as Promise<
		OrderResponse | GetUserOrdersErrorResponse
	>;
}

export function updateOrderStatus(
	id: string,
	status: OrderStatus,
	trackingNumber?: string | null,
) {
	return changeSellerOrderStatusFn({
		data: {
			sellerOrderId: id,
			status,
			trackingNumber,
		},
	});
}
