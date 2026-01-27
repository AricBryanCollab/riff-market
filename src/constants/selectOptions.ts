export const roleOptions = [
	{ value: "SELLER", label: "Seller" },
	{ value: "CUSTOMER", label: "Customer" },
] as const;

export const productCategoryOptions = [
	{ value: "ELECTRIC", label: "Electric Guitar" },
	{ value: "ACOUSTIC", label: "Acoustic Guitar" },
	{ value: "KEYBOARD", label: "Keyboard/Piano" },
	{ value: "PEDALS", label: "Pedals & Effects" },
	{ value: "ACCESSORY", label: "Accessories" },
] as const;

export const productConditionOptions = [
	{ value: "NEW", label: "Brand New" },
	{ value: "MINT", label: "Mint Condition" },
	{ value: "USED", label: "Used" },
] as const;

export const paymentMethodOptions = [
	{ value: "CASH", label: "Cash" },
	{ value: "PAYPAL", label: "PayPal" },
	{ value: "VISA", label: "Visa/Credit Card" },
] as const;

export const orderStatusOptions = [
	{ value: "PENDING", label: "Pending" },
	{ value: "PROCESSING", label: "Processing" },
	{ value: "SHIPPED", label: "Shipped" },
	{ value: "DELIVERED", label: "Delivered" },
	{ value: "CANCELED", label: "Canceled" },
] as const;

export const chatRoleOptions = [
	{ value: "USER", label: "User" },
	{ value: "ASSISTANT", label: "Assistant" },
] as const;

export const themeOptions = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;
