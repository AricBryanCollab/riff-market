import { createServerFn } from "@tanstack/react-start";
import {
	authenticatedServerFunctionMiddleware,
	publicServerFunctionMiddleware,
} from "@/server/function-middleware";
import {
	createListingReviewForCurrentUser,
	listListingReviews,
	validateCreateListingReviewInput,
	validateGetListingReviewsInput,
} from "@/server/review-service";

export const listListingReviewsFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.inputValidator(validateGetListingReviewsInput)
	.handler(async ({ data }) => listListingReviews(data));

export const createListingReviewFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateCreateListingReviewInput)
	.handler(async ({ context, data }) =>
		createListingReviewForCurrentUser(context.user, data),
	);
