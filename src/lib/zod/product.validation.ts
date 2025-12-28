import { z } from "zod";

export const createProductSchema = z.object({
	name: z.string().trim().min(1, "Product name is required"),
	category: z.enum(["ELECTRIC", "ACOUSTIC", "KEYBOARD", "ACCESSORY"]),
	brand: z.string().trim().min(1, "Brand is required"),
	model: z.string().trim().min(1, "Model is required"),
	images: z
		.array(z.string().url("Each image must be a valid URL"))
		.min(1, "At least one image is required"),
	description: z.string().trim().min(1, "Description is required"),
	price: z.number().min(0, "Price must be at least 0"),
	stock: z.number().int().min(0, "Stock must be at least 0"),
});

export const updateProductSchema = createProductSchema.partial();

export const approveProductSchema = z.object({
	isApproved: z.boolean(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ApproveProductInput = z.infer<typeof approveProductSchema>;
