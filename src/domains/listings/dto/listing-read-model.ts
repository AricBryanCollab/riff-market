import { z } from "zod";
import { parseOptionalProductPriceInputToCents } from "@/domains/listings/application/product-money";
import type { ProductCategory, ProductCondition } from "@/types/enum";

export type ListingReadStatus =
	| "PENDING"
	| "APPROVED"
	| "DECLINED"
	| "WITHDRAWN";

export type ListingReadCategory = ProductCategory;
export type ListingReadCondition = ProductCondition;

export type ListingReadModel = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: ListingReadCategory;
	readonly condition: ListingReadCondition;
	readonly brand: string;
	readonly model: string;
	readonly images: string[];
	readonly description: string;
	readonly price: number;
	readonly priceCents?: number | null;
	readonly currencyCode?: string | null;
	readonly stock: number;
	readonly listingStatus: ListingReadStatus;
	readonly createdAt?: Date;
	readonly updatedAt?: Date;
	readonly seller: {
		readonly firstName: string;
		readonly lastName: string;
		readonly email: string;
	};
};

const listingCategorySchema = z.enum([
	"ELECTRIC",
	"ACOUSTIC",
	"KEYBOARD",
	"PEDALS",
	"ACCESSORY",
]);
const listingConditionSchema = z.enum(["NEW", "USED", "MINT"]);

const optionalPriceCentsSchema = z
	.string()
	.nullable()
	.optional()
	.transform((value, ctx) => {
		try {
			return parseOptionalProductPriceInputToCents(value);
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message:
					error instanceof Error ? error.message : "Invalid product price",
			});

			return z.NEVER;
		}
	});

export const approvedListingProductApiQuerySchema = z
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

		category: listingCategorySchema.nullable().optional(),
		condition: listingConditionSchema.nullable().optional(),
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

export type ApprovedListingProductApiQuery = z.infer<
	typeof approvedListingProductApiQuerySchema
>;
