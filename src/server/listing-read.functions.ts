import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
	authenticatedServerFunctionMiddleware,
	createRoleServerFunctionMiddleware,
	publicServerFunctionMiddleware,
} from "@/server/function-middleware";
import {
	getListingCategoryCountDtos,
	getListingDetailsReadDto,
	getListingStatusCountDto,
	getPopularListingBrandCountDtos,
	listCartListingReadDtos,
	listPendingModerationListingReadDtos,
	listRecentListingReadDtos,
	listSellerListingReadDtos,
	searchApprovedListingReadDtos,
} from "@/server/listing-read-service";

const approvedListingSearchServerInputSchema = z.object({
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

const listingDetailsServerInputSchema = z.object({
	listingId: z.string().trim().min(1, "Listing ID is required"),
});

const listingCountStatusServerInputSchema = z.object({
	status: z.enum(["approved", "pending"]),
});

const recentListingsInputSchema = z.object({
	limit: z.number().int().min(1).max(100).optional(),
});

const cartListingDetailsInputSchema = z.object({
	ids: z.array(z.string()),
});

export type ApprovedListingSearchServerInput = z.infer<
	typeof approvedListingSearchServerInputSchema
>;

export const getListingDetailsListingApiFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => listingDetailsServerInputSchema.parse(data))
	.handler(async ({ data }) => getListingDetailsReadDto(data.listingId));

export const getApprovedListingsListingApiFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => approvedListingSearchServerInputSchema.parse(data))
	.handler(async ({ data }) => searchApprovedListingReadDtos(data));

export const getPendingModerationListingsListingApiFn = createServerFn({
	method: "GET",
})
	.middleware(createRoleServerFunctionMiddleware(["ADMIN"]))
	.handler(async () => listPendingModerationListingReadDtos());

export const getSellerListingsListingApiFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) =>
		listSellerListingReadDtos(context.user.id, context.user.role),
	);

export const getListingCategoryCountsListingApiFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => getListingCategoryCountDtos());

export const getPopularListingBrandCountsListingApiFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => getPopularListingBrandCountDtos());

export const getListingStatusCountListingApiFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => listingCountStatusServerInputSchema.parse(data))
	.handler(async ({ data }) =>
		getListingStatusCountDto(data.status === "approved"),
	);

export const getRecentListingsListingApiFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => recentListingsInputSchema.parse(data))
	.handler(async ({ data }) => listRecentListingReadDtos(data.limit));

export const getCartListingsListingApiFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator((data) => cartListingDetailsInputSchema.parse(data))
	.handler(async ({ context, data }) =>
		listCartListingReadDtos(context.user.role, data),
	);
