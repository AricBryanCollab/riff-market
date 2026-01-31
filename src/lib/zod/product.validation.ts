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
	category: z.enum(["ELECTRIC", "ACOUSTIC", "KEYBOARD", "PEDALS", "ACCESSORY"]),
	condition: z.enum(["NEW", "USED", "MINT"]),
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

export const getProductQuerySchema = z.object({
	limit: z
		.string()
		.nullable()
		.transform((val) => {
			if (!val) return 12;
			const parsed = parseInt(val, 10);
			if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
				throw new Error("Limit must be between 1 and 100");
			}
			return parsed;
		}),
	offset: z
		.string()
		.nullable()
		.transform((val) => {
			if (!val) return 0;
			const parsed = parseInt(val, 10);
			if (Number.isNaN(parsed) || parsed < 0) {
				throw new Error("Offset must be 0 or greater");
			}
			return parsed;
		}),
	random: z
		.string()
		.nullable()
		.transform((val) => val === "true"),
});

export const updateProductSchema = createProductSchema.partial();

export const updateProductStatusSchema = z.object({
	isApproved: z.boolean(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type GetProductQuery = z.infer<typeof getProductQuerySchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductStatusInput = z.infer<
	typeof updateProductStatusSchema
>;
