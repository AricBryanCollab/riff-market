import { z } from "zod";
import {
	parseListingPriceInputToAmountMinor,
	priceAmountMinorToDecimalPrice,
} from "@/domains/listings/application/listing-money";
import {
	LISTING_CATEGORIES,
	LISTING_CONDITIONS,
} from "@/domains/listings/domain/listing-attributes";
import { isValidInitialStock } from "@/domains/listings/domain/listing-stock";
import {
	isAllowedImageMimeType,
	LISTING_IMAGE_MAX_BYTES,
} from "@/domains/shared/domain/image-upload";

const fileSchema = z
	.instanceof(File)
	.refine(
		(file) => file.size > 0 && file.size <= LISTING_IMAGE_MAX_BYTES,
		`File size must be less than ${LISTING_IMAGE_MAX_BYTES / (1024 * 1024)}MB`,
	)
	.refine(
		(file) => isAllowedImageMimeType(file.type),
		"File must be a JPEG, PNG, or WebP image",
	);

const listingPriceSchema = z
	.union([z.string(), z.number()])
	.transform((value, ctx) =>
		parseWithListingPriceIssue(ctx, () =>
			priceAmountMinorToDecimalPrice(
				parseListingPriceInputToAmountMinor(value),
			),
		),
	);
const imageUpdateItemSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("existing"),
		imageId: z.string().trim().min(1, "Existing image ID is required"),
	}),
	z.object({
		kind: z.literal("new"),
		index: z
			.number()
			.int("New image index must be a whole number")
			.min(0, "New image index must be at least 0"),
	}),
]);

function parseWithListingPriceIssue<T>(
	ctx: { addIssue: (issue: { code: "custom"; message: string }) => void },
	parse: () => T,
) {
	try {
		return parse();
	} catch (error) {
		ctx.addIssue({
			code: "custom",
			message: error instanceof Error ? error.message : "Invalid listing price",
		});

		return z.NEVER;
	}
}

export const createListingFormSchema = z.object({
	name: z.string().trim().min(1, "Listing name is required"),
	category: z.enum(LISTING_CATEGORIES),
	condition: z.enum(LISTING_CONDITIONS),
	brand: z.string().trim().min(1, "Brand is required"),
	model: z.string().trim().min(1, "Model is required"),
	images: z
		.array(fileSchema)
		.min(1, "At least one image is required")
		.max(5, "Maximum 5 images allowed"),
	description: z.string().trim().min(1, "Description is required"),
	price: listingPriceSchema,
	stock: z
		.number()
		.int()
		.refine(isValidInitialStock, "Stock must be at least 1"),
});

export const updateListingFormSchema = createListingFormSchema
	.partial()
	.extend({
		// Unlike creation, existing listings may legitimately sit at 0 stock.
		stock: z.number().int().min(0, "Stock cannot be negative").optional(),
		imageUpdateMode: z.literal("replace").optional(),
		imageUpdateItems: z.array(imageUpdateItemSchema).max(5).optional(),
	})
	.superRefine((data, ctx) => {
		if (
			data.imageUpdateItems !== undefined &&
			data.imageUpdateMode === undefined
		) {
			ctx.addIssue({
				code: "custom",
				path: ["imageUpdateItems"],
				message: "Image update mode is required when retaining images",
			});
		}
	});

export type CreateListingFormInput = z.input<typeof createListingFormSchema>;
export type UpdateListingFormInput = z.input<typeof updateListingFormSchema>;
