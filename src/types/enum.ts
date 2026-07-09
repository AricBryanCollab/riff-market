import type { ActorRole } from "@/domains/shared/domain/actor";

export type UserRole = ActorRole;

export type {
	ListingCategory,
	ListingCondition,
} from "@/domains/listings/domain/listing-attributes";

export type BuyerOrderSummaryStatus =
	| "PENDING_PAYMENT"
	| "OPEN"
	| "PARTIALLY_SHIPPED"
	| "SHIPPED"
	| "DELIVERED"
	| "PARTIALLY_CANCELED"
	| "CANCELED";

export type SellerOrderViewStatus =
	| "ON_HOLD_PAYMENT"
	| "NEW"
	| "PROCESSING"
	| "SHIPPED"
	| "DELIVERED"
	| "CANCELED";

export type OrderDisplayStatus =
	| BuyerOrderSummaryStatus
	| SellerOrderViewStatus;

export type OrderStatus = SellerOrderViewStatus;

export type DialogType =
	| "signin"
	| "signup"
	| "deleteListing"
	| "updateUser"
	| "updateProfilePic"
	| "deleteUser";
