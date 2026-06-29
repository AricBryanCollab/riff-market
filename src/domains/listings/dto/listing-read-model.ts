import { z } from "zod";
import { parseOptionalListingPriceInputToCents } from "@/domains/listings/application/listing-money";
import type { ListingStatus } from "@/domains/listings/domain/listing";
import type { ListingCategory, ListingCondition } from "@/types/enum";

export type ListingReadStatus = ListingStatus;
export type ListingCountStatus = Extract<
	ListingReadStatus,
	"APPROVED" | "PENDING"
>;

export type ListingReadCategory = ListingCategory;
export type ListingReadCondition = ListingCondition;

export type ListingReadSellerDto = {
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
};

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
	readonly seller: ListingReadSellerDto;
};

export type ListingReadDto = {
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
	readonly isApproved: boolean;
	readonly listingStatus?: ListingReadStatus;
	readonly createdAt?: string;
	readonly updatedAt?: string;
	readonly seller: ListingReadSellerDto;
};

export type ListingCategoryCount = {
	readonly category: ListingReadCategory;
	readonly count: number;
};

export type ListingCategoryCountData = ListingCategoryCount;

export type ListingCategoryMeta = {
	readonly category: ListingReadCategory;
	readonly label: string;
	readonly icon: string;
	readonly count: number;
};

export type ApprovedListingSearchFilterQuery = {
	readonly limit?: number;
	readonly offset?: number;
	readonly category?: string;
	readonly brand?: string;
	readonly search?: string;
	readonly condition?: string;
	readonly priceMin?: number;
	readonly priceMax?: number;
};

export type ListingShopSearch = {
	readonly category?: string;
	readonly brand?: string;
	readonly condition?: string;
	readonly search?: string;
	readonly priceMin?: number;
	readonly priceMax?: number;
	readonly page?: number;
};

export type ListingCountStatusQuery = "approved" | "pending";

export type ApprovedListingCount = {
	readonly approvedProductCount: number;
};

export type PendingListingCount = {
	readonly pendingProductCount: number;
};

export type ListingStatusCount = ApprovedListingCount | PendingListingCount;

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
			return parseOptionalListingPriceInputToCents(value);
		} catch (error) {
			ctx.addIssue({
				code: "custom",
				message:
					error instanceof Error ? error.message : "Invalid listing price",
			});

			return z.NEVER;
		}
	});

export const approvedListingSearchInputSchema = z
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

export type ApprovedListingSearchInput = z.infer<
	typeof approvedListingSearchInputSchema
>;

export const cartListingDetailsInputSchema = z.object({
	ids: z
		.array(z.string().trim().min(1, "Product ID is required"))
		.min(1, "At least one product ID is required")
		.max(100, "Maximum 100 product IDs are allowed"),
});

export type CartListingDetailsInput = z.infer<
	typeof cartListingDetailsInputSchema
>;
