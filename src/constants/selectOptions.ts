import {
	Banknote,
	Bot,
	CheckCircle,
	Clock,
	CreditCard,
	DollarSign,
	Music,
	Package,
	PackageCheck,
	Piano,
	Settings,
	ShoppingCart,
	Store,
	Truck,
	User,
	XCircle,
	Zap,
} from "lucide-react";

// Role options
export const roleOptions = [
	{ value: "SELLER", label: "Seller", icon: Store },
	{ value: "CUSTOMER", label: "Customer", icon: ShoppingCart },
] as const;

// Product Category options
export const productCategoryOptions = [
	{ value: "ELECTRIC", label: "Electric Guitar", icon: Zap },
	{ value: "ACOUSTIC", label: "Acoustic Guitar", icon: Music },
	{ value: "KEYBOARD", label: "Keyboard/Piano", icon: Piano },
	{ value: "PEDALS", label: "Pedals & Effects", icon: Settings },
	{ value: "ACCESSORY", label: "Accessories", icon: Package },
] as const;

// Payment Method options
export const paymentMethodOptions = [
	{ value: "CASH", label: "Cash", icon: Banknote },
	{ value: "PAYPAL", label: "PayPal", icon: DollarSign },
	{ value: "VISA", label: "Visa/Credit Card", icon: CreditCard },
] as const;

// Order Status options
export const orderStatusOptions = [
	{ value: "PENDING", label: "Pending", icon: Clock },
	{ value: "PROCESSING", label: "Processing", icon: PackageCheck },
	{ value: "SHIPPED", label: "Shipped", icon: Truck },
	{ value: "DELIVERED", label: "Delivered", icon: CheckCircle },
	{ value: "CANCELED", label: "Canceled", icon: XCircle },
] as const;

// Chat Role options
export const chatRoleOptions = [
	{ value: "USER", label: "User", icon: User },
	{ value: "ASSISTANT", label: "Assistant", icon: Bot },
] as const;

// Theme Options:
export const themeOptions = [
	{ value: "light", label: "Light", icon: "☀️" },
	{ value: "dark", label: "Dark", icon: "🌙" },
	{ value: "coffee", label: "Coffee", icon: "☕" },
	{ value: "forest", label: "Forest", icon: "🌲" },
	{ value: "ocean", label: "Ocean", icon: "🌊" },
	{ value: "sunset", label: "Sunset", icon: "🌅" },
	{ value: "crimson", label: "Crimson", icon: "🌹" },
] as const;
