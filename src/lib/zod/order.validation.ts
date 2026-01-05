import { z } from "zod";

const orderItemSchema = z.object({
	productId: z.string(),
	quantity: z.number().int().min(1, "Quantity must be at least 1"),
	unitPrice: z.number().min(0, "Unit price must be at least 0"),
});

export const createOrderSchema = z.object({
	shippingAddress: z
		.string()
		.trim()
		.min(10, "Shipping address must be at least 10 characters"),
	paymentMethod: z.enum(["CASH", "PAYPAL", "VISA"]),
	items: z
		.array(orderItemSchema)
		.min(1, "Order must contain at least one item")
		.max(50, "Maximum 50 items allowed per order"),
});

export const updateOrderStatusSchema = z.object({
	status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED"]),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
