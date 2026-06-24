import type { NotificationReadModel } from "@/domains/notifications/dto/notification";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	handleNotificationRoute,
	notificationJsonResponse,
} from "@/server/notification-route-errors";
import {
	getNotificationsForCurrentUser,
	getUnreadNotificationCountForCurrentUser,
	type NotificationIdInput,
	readAllNotificationsForCurrentUser,
	readNotificationForCurrentUser,
	validateNotificationIdInput,
} from "@/server/notification-service";

export type NotificationRouteOperations = {
	readonly getNotificationsForCurrentUser: (
		user: ServerUserContext,
	) => Promise<NotificationReadModel[]>;
	readonly getUnreadNotificationCountForCurrentUser: (
		user: ServerUserContext,
	) => Promise<number>;
	readonly readNotificationForCurrentUser: (
		user: ServerUserContext,
		input: NotificationIdInput,
	) => Promise<NotificationReadModel>;
	readonly readAllNotificationsForCurrentUser: (
		user: ServerUserContext,
	) => Promise<{ readonly count: number }>;
};

const defaultNotificationRouteOperations = {
	getNotificationsForCurrentUser,
	getUnreadNotificationCountForCurrentUser,
	readNotificationForCurrentUser,
	readAllNotificationsForCurrentUser,
} satisfies NotificationRouteOperations;

export function handleListNotificationsRoute(
	user: ServerUserContext,
	operations: NotificationRouteOperations = defaultNotificationRouteOperations,
): Promise<Response> {
	return handleNotificationRoute(async () => {
		const notifications = await operations.getNotificationsForCurrentUser(user);

		return notificationJsonResponse(notifications);
	}, "Failed to get notifications");
}

export function handleUnreadNotificationCountRoute(
	user: ServerUserContext,
	operations: NotificationRouteOperations = defaultNotificationRouteOperations,
): Promise<Response> {
	return handleNotificationRoute(async () => {
		const count =
			await operations.getUnreadNotificationCountForCurrentUser(user);

		return notificationJsonResponse({ count });
	}, "Failed to count unread notifications");
}

export function handleReadNotificationRoute(
	user: ServerUserContext,
	notificationId: string,
	operations: NotificationRouteOperations = defaultNotificationRouteOperations,
): Promise<Response> {
	return handleNotificationRoute(async () => {
		const notification = await operations.readNotificationForCurrentUser(
			user,
			validateNotificationIdInput({ notificationId }),
		);

		return notificationJsonResponse(notification);
	}, "Failed to read the notification");
}

export function handleReadAllNotificationsRoute(
	user: ServerUserContext,
	operations: NotificationRouteOperations = defaultNotificationRouteOperations,
): Promise<Response> {
	return handleNotificationRoute(async () => {
		const result = await operations.readAllNotificationsForCurrentUser(user);

		return notificationJsonResponse(result);
	}, "Failed to read all notifications");
}
