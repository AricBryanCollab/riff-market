export type UserRole = "ADMIN" | "SELLER" | "CUSTOMER";

export type ProductCategory =
	| "ELECTRIC"
	| "ACOUSTIC"
	| "KEYBOARD"
	| "PEDALS"
	| "ACCESSORY";

export type ProductCondition = "NEW" | "USED" | "MINT";

export type PaymentMethod = "CASH" | "PAYPAL" | "VISA";

export type OrderStatus =
	| "PENDING"
	| "PROCESSING"
	| "SHIPPED"
	| "DELIVERED"
	| "CANCELED";

export type DialogType = "signin" | "signup" | "deleteProduct";
