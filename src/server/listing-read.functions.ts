import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	authenticatedServerFunctionMiddleware,
	createRoleServerFunctionMiddleware,
	publicServerFunctionMiddleware,
} from "@/server/function-middleware";
import {
	getApprovedListingsForProductApi,
	getCartListingsForProductApi,
	getListingCategoryCountsForProductApi,
	getListingDetailsForProductApi,
	getListingStatusCountForProductApi,
	getPendingModerationListingsForProductApi,
	getRecentListingsForProductApi,
	getSellerListingsForProductApi,
} from "@/server/listing-read-service";

const productApiQueryInputSchema = z.object({
	limit: z.string().nullable(),
	offset: z.string().nullable(),
	random: z.string().nullable(),
	category: z.string().nullable().optional(),
	condition: z.string().nullable().optional(),
	brand: z.string().nullable().optional(),
	search: z.string().nullable().optional(),
	priceMin: z.string().nullable().optional(),
	priceMax: z.string().nullable().optional(),
});

const productDetailInputSchema = z.object({
	listingId: z.string().trim().min(1, "Listing ID is required"),
});

const productCountStatusInputSchema = z.object({
	status: z.enum(["approved", "pending"]),
});

const recentListingsInputSchema = z.object({
	limit: z.number().int().min(1).max(100).optional(),
});

const cartListingDetailsInputSchema = z.object({
	ids: z.array(z.string()),
});

export type ProductApiQueryInput = z.infer<typeof productApiQueryInputSchema>;

export const getListingDetailsProductApiFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => productDetailInputSchema.parse(data))
	.handler(async ({ data }) => getListingDetailsForProductApi(data.listingId));

export const getApprovedListingsProductApiFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => productApiQueryInputSchema.parse(data))
	.handler(async ({ data }) => getApprovedListingsForProductApi(data));

export const getPendingModerationListingsProductApiFn = createServerFn({
	method: "GET",
})
	.middleware(createRoleServerFunctionMiddleware(["ADMIN"]))
	.handler(async () => getPendingModerationListingsForProductApi());

export const getSellerListingsProductApiFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) =>
		getSellerListingsForProductApi(context.user.id, context.user.role),
	);

export const getListingCategoryCountsProductApiFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => getListingCategoryCountsForProductApi());

export const getListingStatusCountProductApiFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => productCountStatusInputSchema.parse(data))
	.handler(async ({ data }) =>
		getListingStatusCountForProductApi(data.status === "approved"),
	);

export const getRecentListingsProductApiFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => recentListingsInputSchema.parse(data))
	.handler(async ({ data }) => getRecentListingsForProductApi(data.limit));

export const getCartListingsProductApiFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator((data) => cartListingDetailsInputSchema.parse(data))
	.handler(async ({ context, data }) =>
		getCartListingsForProductApi(context.user.role, data),
	);
