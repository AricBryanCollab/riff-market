import type { SellerStatusCommand } from "@/domains/ordering/domain/seller-order";
import type { OrderDisplayStatus } from "@/types/enum";

export interface OrderItem {
	listingId: string;
	quantity: number;
}

interface OrderDisplayItem {
	listingId: string;
	quantity: number;
}

export interface OrderItemWithPricing extends OrderDisplayItem {
	unitPriceAmountMinor: number;
	subTotalAmountMinor: number;
	currencyCode: string;
}

interface OrderCheckoutData {
	shippingAddress: string;
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
		priceAmountMinor: number;
		currencyCode: string;
		seller: SellerDetails;
	};
}

export interface OrderResponse {
	id: string;
	orderDate: Date;
	totalAmountMinor: number;
	currencyCode: string;
	shippingAddress: string;
	trackingNumber: string;
	status: OrderDisplayStatus;
	allowedStatusCommands?: readonly SellerStatusCommand[];
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
