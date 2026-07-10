import type { DomainEvent } from "@/domains/shared/domain/domain-event";

export type PurchasePlacedNotificationEvent = DomainEvent<
	"PurchasePlaced",
	{
		readonly purchaseId: string;
		readonly customerId: string;
		readonly purchaseNumber: string;
		readonly totalAmountCents: number;
		readonly currencyCode: string;
	}
>;

export type SellerOrderCreatedNotificationEvent = DomainEvent<
	"SellerOrderCreated",
	{
		readonly sellerOrderId: string;
		readonly purchaseId: string;
		readonly sellerId: string;
		readonly subtotalCents: number;
		readonly currencyCode: string;
	}
>;

export type ListingModerationNotificationEvent = DomainEvent<
	"ListingApproved" | "ListingDeclined",
	{
		readonly listingId: string;
		readonly sellerId: string;
	}
>;
