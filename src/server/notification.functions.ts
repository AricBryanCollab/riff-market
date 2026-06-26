import { createServerFn } from "@tanstack/react-start";
import { authenticatedServerFunctionMiddleware } from "@/server/function-middleware";
import {
	getNotificationsForCurrentUser,
	getUnreadNotificationCountForCurrentUser,
	readAllNotificationsForCurrentUser,
	readNotificationForCurrentUser,
	validateNotificationIdInput,
} from "@/server/notification-service";

export const listNotificationsFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) => getNotificationsForCurrentUser(context.user));

export const getUnreadNotificationCountFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) => {
		const count = await getUnreadNotificationCountForCurrentUser(context.user);

		return { count };
	});

export const readNotificationFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.inputValidator(validateNotificationIdInput)
	.handler(async ({ context, data }) =>
		readNotificationForCurrentUser(context.user, data),
	);

export const readAllNotificationsFn = createServerFn({ method: "POST" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) =>
		readAllNotificationsForCurrentUser(context.user),
	);
