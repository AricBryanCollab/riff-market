import { createServerFn } from "@tanstack/react-start";
import { authenticatedServerFunctionMiddleware } from "@/server/function-middleware";
import {
	createListingForCurrentUser,
	moderateListingForCurrentUser,
	removeListingForCurrentUser,
	updateListingForCurrentUser,
	validateCreateListingFormData,
	validateModerateListingInput,
	validateRemoveListingInput,
	validateUpdateListingFormData,
} from "@/server/listing-service";

export const createListingFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateCreateListingFormData)
	.handler(async ({ context, data }) =>
		createListingForCurrentUser(context.user, data),
	);

export const updateListingFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateUpdateListingFormData)
	.handler(async ({ context, data }) =>
		updateListingForCurrentUser(context.user, data),
	);

export const deleteListingFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateRemoveListingInput)
	.handler(async ({ context, data }) =>
		removeListingForCurrentUser(context.user, data),
	);

export const moderateListingFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateModerateListingInput)
	.handler(async ({ context, data }) =>
		moderateListingForCurrentUser(context.user, data),
	);
