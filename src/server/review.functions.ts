import { createServerFn } from "@tanstack/react-start";
import { requestLoggerMiddleware } from "@/middleware";
import {
	authenticatedServerFunctionMiddleware,
	reviewErrorMiddleware,
} from "@/server/function-middleware";
import {
	createListingReviewForCurrentUser,
	listListingReviews,
	validateCreateListingReviewInput,
	validateGetListingReviewsInput,
} from "@/server/review-service";

export const listListingReviewsFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware, reviewErrorMiddleware])
	.inputValidator(validateGetListingReviewsInput)
	.handler(async ({ data }) => listListingReviews(data));

export const createListingReviewFn = createServerFn({ method: "POST" })
	.middleware([...authenticatedServerFunctionMiddleware, reviewErrorMiddleware])
	.inputValidator(validateCreateListingReviewInput)
	.handler(async ({ context, data }) =>
		createListingReviewForCurrentUser(context.user, data),
	);
