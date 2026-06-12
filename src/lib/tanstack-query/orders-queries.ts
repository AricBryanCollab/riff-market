import { apiFetch } from "@/lib/tanstack-query/fetch";
import { placePurchaseFn } from "@/server/order.functions";
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
	return apiFetch<OrderResponse[] | GetUserOrdersErrorResponse>("/api/orders", {
		method: "GET",
	});
}

export function getOrderBySeller() {
	return apiFetch<OrderResponse[] | GetUserOrdersErrorResponse>(
		"/api/orders/seller",
		{
			method: "GET",
		},
	);
}

export function getOrderById(id: string) {
	return apiFetch<OrderResponse | GetUserOrdersErrorResponse>(
		`/api/orders/${id}`,
		{
			method: "GET",
		},
	);
}

export function updateOrderStatus(id: string, status: OrderStatus) {
	return apiFetch<OrderResponse>(`/api/orders/${id}`, {
		method: "PUT",
		body: JSON.stringify(status),
	});
}
