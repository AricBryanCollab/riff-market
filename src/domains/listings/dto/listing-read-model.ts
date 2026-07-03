import { z } from "zod";
import { parseOptionalListingPriceInputToAmountMinor } from "@/domains/listings/application/listing-money";
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

export type ListingImageDto = {
	readonly imageId: string;
	readonly url: string;
};

export type ListingReadModel = {
	readonly id: string;
	readonly sellerId: string;
	readonly name: string;
	readonly category: ListingReadCategory;
	readonly condition: ListingReadCondition;
	readonly brand: string;
	readonly model: string;
	readonly images: ListingImageDto[];
	readonly description: string;
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
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
	readonly images: ListingImageDto[];
	readonly description: string;
	readonly priceAmountMinor: number;
	readonly currencyCode: string;
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

export type ListingBrandCount = {
	readonly brand: string;
	readonly count: number;
};

export type ListingBrandCountData = ListingBrandCount;

export type ListingCategoryMeta = {
	readonly category: ListingReadCategory;
	readonly label: string;
	readonly icon: string;
	readonly count: number;
};

// Human-entered listing price in marketplace currency, not minor units.
export type ListingPriceInput = string;

export type ApprovedListingSearchFilterQuery = {
	readonly limit?: number;
	readonly offset?: number;
	readonly category?: string;
	readonly brand?: string;
	readonly search?: string;
	readonly condition?: string;
	readonly priceMin?: ListingPriceInput;
	readonly priceMax?: ListingPriceInput;
};

export type ListingShopSearch = {
	readonly category?: string;
	readonly brand?: string;
	readonly condition?: string;
	readonly search?: string;
	readonly priceMin?: ListingPriceInput;
	readonly priceMax?: ListingPriceInput;
	readonly page?: number;
};

export type ListingCountStatusQuery = "approved" | "pending";

export type ApprovedListingCount = {
	readonly approvedListingCount: number;
};

export type PendingListingCount = {
	readonly pendingListingCount: number;
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

const optionalListingPriceInputSchema = z
	.string()
	.nullable()
	.optional()
	.transform((value, ctx) => {
		try {
			return parseOptionalListingPriceInputToAmountMinor(value);
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
		priceMin: optionalListingPriceInputSchema,
		priceMax: optionalListingPriceInputSchema,
	})
	.transform(({ priceMin, priceMax, ...query }) => ({
		...query,
		priceMinAmountMinor: priceMin,
		priceMaxAmountMinor: priceMax,
	}));

export type ApprovedListingSearchInput = z.infer<
	typeof approvedListingSearchInputSchema
>;

export const cartListingDetailsInputSchema = z.object({
	ids: z
		.array(z.string().trim().min(1, "Listing ID is required"))
		.min(1, "At least one listing ID is required")
		.max(100, "Maximum 100 listing IDs are allowed"),
});

export type CartListingDetailsInput = z.infer<
	typeof cartListingDetailsInputSchema
>;
