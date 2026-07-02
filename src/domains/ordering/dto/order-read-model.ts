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

type OrderingOrderReadModelBase = {
	readonly id: string;
	readonly orderDate: Date;
	readonly totalAmountMinor: number;
	readonly currencyCode: string;
	readonly shippingAddress: string;
	readonly trackingNumber: string;
	readonly status: OrderingOrderReadStatus;
	readonly items: OrderingOrderItemReadModel[];
};

export type BuyerPurchaseReadModel = OrderingOrderReadModelBase & {
	readonly kind: "buyer-purchase";
	readonly purchaseId: string;
	readonly status: BuyerOrderSummaryStatus;
};

export type SellerOrderReadModel = OrderingOrderReadModelBase & {
	readonly kind: "seller-order";
	readonly purchaseId: string;
	readonly sellerOrderId: string;
	readonly status: SellerOrderReadStatus;
	readonly customer: {
		readonly id: string;
		readonly email: string;
		readonly firstName: string;
		readonly lastName: string;
	};
};

export type OrderingOrderReadModel =
	| BuyerPurchaseReadModel
	| SellerOrderReadModel;
