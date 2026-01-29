import type { OrderStatus, PaymentMethod } from "@/types/enum";

export interface OrderItem {
	productId: string;
	quantity: number;
}

interface OrderItemWithPricing extends OrderItem {
	unitPrice: number;
	subTotal: number;
}

interface BaseOrderData {
	userId: string;
	shippingAddress: string;
	paymentMethod: PaymentMethod;
}

export interface OrderRequest extends BaseOrderData {
	items: OrderItem[];
}

export interface CreateOrderRepoData extends BaseOrderData {
	orderDate: Date;
	totalAmount: number;
	trackingNumber: string;
	items: OrderItemWithPricing[];
}

interface SellerDetails {
	firstName: string;
	lastName: string;
	email: string;
}

interface OrderItemResponse extends OrderItemWithPricing {
	id: string;
	orderId: string;
	product: {
		id: string;
		name: string;
		images: string[];
		price: number;
		seller: SellerDetails;
	};
}

export interface OrderResponse extends BaseOrderData {
	id: string;
	orderDate: Date;
	totalAmount: number;
	trackingNumber: string;
	paymentMethod: PaymentMethod;
	status: OrderStatus;
	items?: OrderItemResponse[];
	customer?: {
		email: string;
		firstName: string;
		lastName: string;
	};
}

export interface OrderErrorResponse {
	error: string;
	details?: string | unknown;
}

export interface GetUserOrdersResponse {
	orders: OrderResponse[];
	total: number;
}

export interface GetUserOrdersErrorResponse {
	error: string;
}
