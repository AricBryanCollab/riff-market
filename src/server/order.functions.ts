import { createServerFn } from "@tanstack/react-start";
import { authenticatedServerFunctionMiddleware } from "@/server/function-middleware";
import {
	changeSellerOrderStatusForCurrentUser,
	getOrderDetailForCurrentUser,
	listOrdersForCurrentUser,
	validateChangeSellerOrderStatusInput,
	validateOrderDetailInput,
} from "@/server/order-service";
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

export const listOrdersForCurrentUserFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) => listOrdersForCurrentUser(context.user));

export const getOrderDetailFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateOrderDetailInput)
	.handler(async ({ context, data }) =>
		getOrderDetailForCurrentUser(context.user, data),
	);

export const changeSellerOrderStatusFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateChangeSellerOrderStatusInput)
	.handler(async ({ context, data }) =>
		changeSellerOrderStatusForCurrentUser(context.user, data),
	);
