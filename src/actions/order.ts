import { createOrderSchema } from "@/lib/zod/order.validation";
import type { OrderRequest } from "@/types/order";
import { generateTrackingNumber } from "@/utils/generateTrackingNumber";
import { useAppSession } from "@/utils/session";

export async function placeOrderService(rawData: OrderRequest) {
	const session = await useAppSession();
	const parsed = createOrderSchema.safeParse(rawData);

	if (!parsed.success) {
		return {
			error: "Invalid data to place order",
			details: parsed.error,
		};
	}

	const data = parsed.data;
	const customerId = session.data.userId;
	if (!customerId) {
		return { error: "Unauthorized, user must be a customer" };
	}

	const totalAmount = data.items.reduce(
		(sum, item) => sum + item.unitPrice * item.quantity,
		0,
	);

	const trackingNumber = generateTrackingNumber();
}

export function getOrdersList() {}

export function getOrderItem() {}

export function updateOrderStatus() {}

export function cancelOrder() {}
