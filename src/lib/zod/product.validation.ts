import { z } from "zod";

const fileSchema = z
	.instanceof(File)
	.refine(
		(file) => file.size <= 4 * 1024 * 1024,
		"File size must be less than 4MB",
	)
	.refine(
		(file) =>
			["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
				file.type,
			),
		"File must be a JPEG, PNG, or WebP image",
	);

export const createProductSchema = z.object({
	name: z.string().trim().min(1, "Product name is required"),
	category: z.enum(["ELECTRIC", "ACOUSTIC", "KEYBOARD", "ACCESSORY"]),
	brand: z.string().trim().min(1, "Brand is required"),
	model: z.string().trim().min(1, "Model is required"),
	images: z
		.array(fileSchema)
		.min(1, "At least one image is required")
		.max(5, "Maximum 5 images allowed"),
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
