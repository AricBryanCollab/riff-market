import type { OrderDisplayStatus } from "@/types/enum";

const orderStatusLabels: Record<OrderDisplayStatus, string> = {
	PENDING: "Pending",
	PROCESSING: "Processing",
	SHIPPED: "Shipped",
	DELIVERED: "Delivered",
	CANCELED: "Canceled",
	PENDING_PAYMENT: "Pending payment",
	OPEN: "Open",
	PARTIALLY_SHIPPED: "Partially shipped",
	PARTIALLY_CANCELED: "Partially canceled",
	ON_HOLD_PAYMENT: "On hold",
	NEW: "New",
};

export function formatOrderStatusLabel(status: OrderDisplayStatus) {
	return orderStatusLabels[status];
}
