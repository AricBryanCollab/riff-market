import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { APPROVED_LISTING_SEARCH_MAX_LIMIT } from "@/domains/listings/application/listing-queries";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	authenticatedServerFunctionMiddleware,
	getOptionalServerUserContext,
	publicServerFunctionMiddleware,
	type ServerUserContext,
} from "@/server/function-middleware";
import {
	getListingCategoryCountDtos,
	getListingDetailsResponse,
	getListingStatusCountDto,
	getPopularListingBrandCountDtos,
	listCartListingResponses,
	listPendingModerationListingResponses,
	listRecentListingResponses,
	listSellerListingResponses,
	searchApprovedListingResponses,
} from "@/server/listing-query-service";

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
	limit: z
		.number()
		.int()
		.min(1)
		.max(APPROVED_LISTING_SEARCH_MAX_LIMIT)
		.optional(),
});

const cartListingDetailsInputSchema = z.object({
	ids: z.array(z.string()),
});

export type ApprovedListingSearchServerInput = z.infer<
	typeof approvedListingSearchServerInputSchema
>;

export const getListingDetailsServerFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => listingDetailsServerInputSchema.parse(data))
	.handler(async ({ data }) =>
		getListingDetailsResponse(
			toOptionalActor(await getOptionalServerUserContext()),
			data.listingId,
		),
	);

export const getApprovedListingsServerFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => approvedListingSearchServerInputSchema.parse(data))
	.handler(async ({ data }) =>
		searchApprovedListingResponses(
			toOptionalActor(await getOptionalServerUserContext()),
			data,
		),
	);

export const getPendingModerationListingsServerFn = createServerFn({
	method: "GET",
})
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) =>
		listPendingModerationListingResponses(toActor(context.user)),
	);

export const getSellerListingsServerFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) =>
		listSellerListingResponses(toActor(context.user)),
	);

export const getListingCategoryCountsServerFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => getListingCategoryCountDtos());

export const getPopularListingBrandCountsServerFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => getPopularListingBrandCountDtos());

export const getListingStatusCountServerFn = createServerFn({
	method: "GET",
})
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => listingCountStatusServerInputSchema.parse(data))
	.handler(async ({ data }) =>
		getListingStatusCountDto(data.status === "approved"),
	);

export const getRecentListingsServerFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => recentListingsInputSchema.parse(data))
	.handler(async ({ data }) =>
		listRecentListingResponses(
			toOptionalActor(await getOptionalServerUserContext()),
			data.limit,
		),
	);

export const getCartListingsServerFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator((data) => cartListingDetailsInputSchema.parse(data))
	.handler(async ({ context, data }) =>
		listCartListingResponses(toActor(context.user), data),
	);

function toActor(user: ServerUserContext): Actor {
	return { id: user.id, role: user.role };
}

function toOptionalActor(user: ServerUserContext | null): Actor | null {
	return user ? toActor(user) : null;
}
