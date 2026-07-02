import { z } from "zod";

const placePurchaseItemSchema = z.object({
	listingId: z.string().trim().min(1, "Listing ID is required"),
	quantity: z
		.number()
		.int("Quantity must be a whole number")
		.positive("Quantity must be positive")
		.max(Number.MAX_SAFE_INTEGER, "Quantity is too large"),
});

export const placePurchaseInputSchema = z.object({
	items: z
		.array(placePurchaseItemSchema)
		.min(1, "Order item must contain at least one item"),
	shippingAddress: z.string().trim().min(5, "Shipping address is required"),
});

export type PlacePurchaseInput = z.infer<typeof placePurchaseInputSchema>;
