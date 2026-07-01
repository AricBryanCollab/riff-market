import type { OrderDisplayStatus, PaymentMethod } from "@/types/enum";

export interface OrderItem {
	listingId: string;
	quantity: number;
}

interface OrderDisplayItem {
	listingId: string;
	quantity: number;
}

export interface OrderItemWithPricing extends OrderDisplayItem {
	unitPrice: number;
	subTotal: number;
}

interface OrderCheckoutData {
	shippingAddress: string;
	paymentMethod: PaymentMethod;
}

export interface OrderRequest extends OrderCheckoutData {
	items: OrderItem[];
}

interface SellerDetails {
	id?: string;
	firstName: string;
	lastName: string;
	email?: string;
}

interface OrderItemResponse extends OrderItemWithPricing {
	id: string;
	orderId: string;
	listing: {
		id: string;
		name: string;
		images: string[];
		price: number;
		seller: SellerDetails;
	};
}

export interface OrderResponse {
	id: string;
	orderDate: Date;
	totalAmount: number;
	shippingAddress: string;
	trackingNumber: string;
	paymentMethod?: PaymentMethod;
	status: OrderDisplayStatus;
	items?: OrderItemResponse[];
	customer?: {
		id?: string;
		email: string;
		firstName: string;
		lastName: string;
	};
}

export interface GetUserOrdersErrorResponse {
	error: string;
}
