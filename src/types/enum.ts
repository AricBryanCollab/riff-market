export type UserRole = "ADMIN" | "SELLER" | "CUSTOMER";

export type ListingCategory =
	| "ELECTRIC"
	| "ACOUSTIC"
	| "KEYBOARD"
	| "PEDALS"
	| "ACCESSORY";

export type ListingCondition = "NEW" | "USED" | "MINT";

export type PaymentMethod = "CASH" | "PAYPAL" | "VISA";

export type LegacyOrderStatus =
	| "PENDING"
	| "PROCESSING"
	| "SHIPPED"
	| "DELIVERED"
	| "CANCELED";

export type BuyerOrderSummaryStatus =
	| "PENDING_PAYMENT"
	| "OPEN"
	| "PARTIALLY_SHIPPED"
	| "SHIPPED"
	| "DELIVERED"
	| "PARTIALLY_CANCELED"
	| "CANCELED";

export type SellerOrderReadStatus =
	| "ON_HOLD_PAYMENT"
	| "NEW"
	| "PROCESSING"
	| "SHIPPED"
	| "DELIVERED"
	| "CANCELED";

export type OrderDisplayStatus =
	| LegacyOrderStatus
	| BuyerOrderSummaryStatus
	| SellerOrderReadStatus;

export type OrderStatus = LegacyOrderStatus;

export type DialogType =
	| "signin"
	| "signup"
	| "deleteListing"
	| "updateUser"
	| "updateProfilePic"
	| "deleteUser";
