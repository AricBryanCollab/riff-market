import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	authenticatedServerFunctionMiddleware,
	createRoleServerFunctionMiddleware,
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
	limit: z.number().int().min(1).max(100).optional(),
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
			toActor(await getOptionalServerUserContext()),
			data.listingId,
		),
	);

export const getApprovedListingsServerFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator((data) => approvedListingSearchServerInputSchema.parse(data))
	.handler(async ({ data }) => searchApprovedListingResponses(data));

export const getPendingModerationListingsServerFn = createServerFn({
	method: "GET",
})
	.middleware(createRoleServerFunctionMiddleware(["ADMIN"]))
	.handler(async () => listPendingModerationListingResponses());

export const getSellerListingsServerFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) =>
		listSellerListingResponses(context.user.id, context.user.role),
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
	.handler(async ({ data }) => listRecentListingResponses(data.limit));

export const getCartListingsServerFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator((data) => cartListingDetailsInputSchema.parse(data))
	.handler(async ({ context, data }) =>
		listCartListingResponses(context.user.role, data),
	);

function toActor(user: ServerUserContext | null): Actor | null {
	return user ? { id: user.id, role: user.role } : null;
}
