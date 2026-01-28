import { apiFetch } from "@/lib/tanstack-query/fetch";
import type { OrderStatus } from "@/types/enum";
import type {
	GetUserOrdersErrorResponse,
	OrderErrorResponse,
	OrderRequest,
	OrderResponse,
} from "@/types/order";

export function createOrder(data: OrderRequest) {
	return apiFetch<OrderResponse | OrderErrorResponse>("/api/orders", {
		method: "POST",
		body: JSON.stringify(data),
	});
}

export function getOrderByCustomer() {
	return apiFetch<OrderResponse[] | GetUserOrdersErrorResponse>("/api/orders", {
		method: "GET",
	});
}

export function getOrderBySeller() {
	return apiFetch<OrderErrorResponse[] | GetUserOrdersErrorResponse>(
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
