import { createServerFn } from "@tanstack/react-start";
import {
	authenticatedServerFunctionMiddleware,
	getOptionalServerUserContext,
	publicServerFunctionMiddleware,
} from "@/server/function-middleware";
import {
	getNotificationsForCurrentUser,
	getUnreadNotificationCountForOptionalUser,
	readAllNotificationsForCurrentUser,
	readNotificationForCurrentUser,
	validateNotificationIdInput,
} from "@/server/notification-service";

export const listNotificationsFn = createServerFn({ method: "GET" })
	.middleware(authenticatedServerFunctionMiddleware)
	.handler(async ({ context }) => getNotificationsForCurrentUser(context.user));

export const getUnreadNotificationCountFn = createServerFn({ method: "GET" })
	.middleware(publicServerFunctionMiddleware)
	.handler(async () => {
		const count = await getUnreadNotificationCountForOptionalUser(
			await getOptionalServerUserContext(),
		);

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
