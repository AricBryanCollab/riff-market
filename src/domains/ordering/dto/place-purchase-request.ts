import { z } from "zod";
import { isValidShippingAddress } from "@/domains/ordering/domain/shipping-address";

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
	shippingAddress: z
		.string()
		.trim()
		.refine(
			isValidShippingAddress,
			"Shipping address must be at least 5 characters",
		),
});

export type PlacePurchaseInput = z.infer<typeof placePurchaseInputSchema>;
