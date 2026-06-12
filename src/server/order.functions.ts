import { createServerFn } from "@tanstack/react-start";
import { authenticatedServerFunctionMiddleware } from "@/server/function-middleware";
import {
	placePurchaseForCurrentUser,
	validatePlacePurchaseInput,
} from "@/server/place-purchase-service";

export const placePurchaseFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validatePlacePurchaseInput)
	.handler(async ({ context, data }) =>
		placePurchaseForCurrentUser(context.user, data),
	);
