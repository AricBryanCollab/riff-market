import type { PaymentMethod } from "@/types/enum";

interface OrderItem {
	productId: string;
	quantity: number;
	unitPrice: number;
}

export interface OrderRequest {
	userId: string;
	shippingAddress: string;
	paymentMethod: PaymentMethod;
	items: Array<OrderItem>;
}

export interface OrderResponse {
	message: string;
	order: OrderItem[];
}
