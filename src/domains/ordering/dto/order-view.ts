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

export const sellerOrderViewStatuses = [
	"ON_HOLD_PAYMENT",
	"NEW",
	"PROCESSING",
	"SHIPPED",
	"DELIVERED",
	"CANCELED",
] as const;

export type SellerOrderViewStatus = (typeof sellerOrderViewStatuses)[number];

export type OrderViewStatus = BuyerOrderSummaryStatus | SellerOrderViewStatus;

export type OrderItemView = {
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

type OrderViewBase = {
	readonly id: string;
	readonly orderDate: Date;
	readonly totalAmountMinor: number;
	readonly currencyCode: string;
	readonly shippingAddress: string;
	readonly trackingNumber: string;
	readonly status: OrderViewStatus;
	readonly items: OrderItemView[];
};

export type BuyerPurchaseView = OrderViewBase & {
	readonly kind: "buyer-purchase";
	readonly purchaseId: string;
	readonly status: BuyerOrderSummaryStatus;
};

export type SellerOrderView = OrderViewBase & {
	readonly kind: "seller-order";
	readonly purchaseId: string;
	readonly sellerOrderId: string;
	readonly status: SellerOrderViewStatus;
	readonly customer: {
		readonly id: string;
		readonly email: string;
		readonly firstName: string;
		readonly lastName: string;
	};
};

export type OrderView = BuyerPurchaseView | SellerOrderView;
