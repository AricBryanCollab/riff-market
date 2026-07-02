export const buyerOrderSummaryStatuses = [
	"PENDING_PAYMENT",
	"OPEN",
	"PARTIALLY_SHIPPED",
	"SHIPPED",
	"DELIVERED",
	"PARTIALLY_CANCELED",
	"CANCELED",
] as const;

export type BuyerOrderSummaryStatus =
	(typeof buyerOrderSummaryStatuses)[number];

export const sellerOrderReadStatuses = [
	"ON_HOLD_PAYMENT",
	"NEW",
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"CANCELED",
] as const;

export type SellerOrderReadStatus = (typeof sellerOrderReadStatuses)[number];

export type OrderingOrderReadStatus =
	| BuyerOrderSummaryStatus
	| SellerOrderReadStatus;

export type OrderingOrderItemReadModel = {
	readonly id: string;
	readonly orderId: string;
	readonly listingId: string;
	readonly quantity: number;
	readonly unitPriceAmountMinor: number;
	readonly subTotalAmountMinor: number;
	readonly currencyCode: string;
	readonly listing: {
		readonly id: string;
		readonly name: string;
		readonly images: string[];
		readonly priceAmountMinor: number;
		readonly currencyCode: string;
		readonly seller: {
			readonly id: string;
			readonly firstName: string;
			readonly lastName: string;
			readonly email: string;
		};
	};
};

export type OrderingOrderReadModel = {
	readonly id: string;
	readonly purchaseId?: string;
	readonly sellerOrderId?: string;
	readonly orderDate: Date;
	readonly totalAmountMinor: number;
	readonly currencyCode: string;
	readonly shippingAddress: string;
	readonly trackingNumber: string;
	readonly status: OrderingOrderReadStatus;
	readonly items: OrderingOrderItemReadModel[];
	readonly customer?: {
		readonly id?: string;
		readonly email: string;
		readonly firstName: string;
		readonly lastName: string;
	};
};
