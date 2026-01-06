import { z } from "zod";

export const placeOrderSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.string(),
				quantity: z.number().int().positive(),
			}),
		)
		.min(1, "Order item must contain at least one item"),
	shippingAddress: z.string().min(5, "Shipping address is required"),
	paymentMethod: z.enum(["CASH", "PAYPAL", "VISA"]),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
