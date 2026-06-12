import { z } from "zod";

export const placePurchaseInputSchema = z.object({
	items: z
		.array(
			z.object({
				productId: z.string().trim().min(1, "Product ID is required"),
				quantity: z
					.number()
					.int("Quantity must be a whole number")
					.positive("Quantity must be positive")
					.max(Number.MAX_SAFE_INTEGER, "Quantity is too large"),
			}),
		)
		.min(1, "Order item must contain at least one item"),
	shippingAddress: z.string().trim().min(5, "Shipping address is required"),
	paymentMethod: z.enum(["CASH", "PAYPAL", "VISA"]),
});

export type PlacePurchaseInput = z.infer<typeof placePurchaseInputSchema>;
