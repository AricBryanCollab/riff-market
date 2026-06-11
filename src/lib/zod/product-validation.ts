import { z } from "zod";
import {
	parseOptionalProductPriceInputToCents,
	parseProductPriceInputToCents,
	priceCentsToDecimalPrice,
} from "@/domains/listings/application/product-money";

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

const productPriceSchema = z
	.union([z.string(), z.number()])
	.transform((value, ctx) =>
		parseWithProductPriceIssue(ctx, () =>
			priceCentsToDecimalPrice(parseProductPriceInputToCents(value)),
		),
	);

const optionalPriceCentsSchema = z
	.string()
	.nullable()
	.optional()
	.transform((value, ctx) =>
		parseWithProductPriceIssue(ctx, () =>
			parseOptionalProductPriceInputToCents(value),
		),
	);

function parseWithProductPriceIssue<T>(
	ctx: { addIssue: (issue: { code: "custom"; message: string }) => void },
	parse: () => T,
) {
	try {
		return parse();
	} catch (error) {
		ctx.addIssue({
			code: "custom",
			message: error instanceof Error ? error.message : "Invalid product price",
		});

		return z.NEVER;
	}
}

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
	price: productPriceSchema,
	stock: z.number().int().min(0, "Stock must be at least 0"),
});

export const getProductQuerySchema = z
	.object({
		limit: z
			.string()
			.nullable()
			.transform((v) => (v ? Number(v) : 12))
			.pipe(z.number().min(1).max(100)),

		offset: z
			.string()
			.nullable()
			.transform((v) => (v ? Number(v) : 0))
			.pipe(z.number().min(0)),

		random: z
			.string()
			.nullable()
			.transform((v) => v === "true"),

		category: z.string().nullable().optional(),
		condition: z.string().nullable().optional(),
		brand: z.string().nullable().optional(),
		search: z.string().nullable().optional(),
		priceMin: optionalPriceCentsSchema,
		priceMax: optionalPriceCentsSchema,
	})
	.transform(({ priceMin, priceMax, ...query }) => ({
		...query,
		priceMinCents: priceMin,
		priceMaxCents: priceMax,
	}));

export const getProductsByIdsQuerySchema = z.object({
	ids: z
		.array(z.string().trim().min(1, "Product ID is required"))
		.min(1, "At least one product ID is required")
		.max(100, "Maximum 100 product IDs are allowed"),
});

export const updateProductSchema = createProductSchema.partial();

export const updateProductStatusSchema = z.object({
	isApproved: z.boolean(),
});

export type CreateProductInput = z.input<typeof createProductSchema>;
export type GetProductQuery = z.infer<typeof getProductQuerySchema>;
export type GetProductsByIdsQuery = z.infer<typeof getProductsByIdsQuerySchema>;
export type UpdateProductInput = z.input<typeof updateProductSchema>;
export type UpdateProductStatusInput = z.infer<
	typeof updateProductStatusSchema
>;
