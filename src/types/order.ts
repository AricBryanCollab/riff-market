import type { PaymentMethod } from "@/types/enum";

interface OrderItem {
	productId: string;
	quantity: number;
}

export interface OrderRequest {
	userId: string;
	shippingAddress: string;
	paymentMethod: PaymentMethod;
	items: OrderItem[];
}

export interface OrderResponse {
	message: string;
	order: OrderItem[];
}
