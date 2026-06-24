import { describe, expect, it } from "vitest";
import type { NotificationReadModel } from "@/domains/notifications/dto/notification";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	handleListNotificationsRoute,
	handleReadAllNotificationsRoute,
	handleReadNotificationRoute,
	handleUnreadNotificationCountRoute,
	type NotificationRouteOperations,
} from "@/server/notification-route-handlers";
import { NotificationRequestError } from "@/server/notification-service";

const customerUser: ServerUserContext = {
	id: "customer-1",
	email: "customer@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

describe("notification route handlers", () => {
	it("returns the authenticated user's notifications", async () => {
		const response = await handleListNotificationsRoute(
			customerUser,
			routeOperations({
				getNotificationsForCurrentUser: async (user) => [
					makeNotification({ userId: user.id }),
				],
			}),
		);

		await expect(response.json()).resolves.toEqual([
			makeNotification({ userId: "customer-1" }),
		]);
		expect(response.status).toBe(200);
	});

	it("returns the authenticated user's unread count", async () => {
		const response = await handleUnreadNotificationCountRoute(
			customerUser,
			routeOperations({
				getUnreadNotificationCountForCurrentUser: async () => 3,
			}),
		);

		await expect(response.json()).resolves.toEqual({ count: 3 });
		expect(response.status).toBe(200);
	});

	it("marks one notification as read for the authenticated user", async () => {
		const response = await handleReadNotificationRoute(
			customerUser,
			"notification-1",
			routeOperations({
				readNotificationForCurrentUser: async (user, input) =>
					makeNotification({
						id: input.notificationId,
						userId: user.id,
						isRead: true,
					}),
			}),
		);

		await expect(response.json()).resolves.toEqual(
			makeNotification({
				id: "notification-1",
				userId: "customer-1",
				isRead: true,
			}),
		);
		expect(response.status).toBe(200);
	});

	it("marks all notifications as read for the authenticated user", async () => {
		const response = await handleReadAllNotificationsRoute(
			customerUser,
			routeOperations({
				readAllNotificationsForCurrentUser: async () => ({ count: 2 }),
			}),
		);

		await expect(response.json()).resolves.toEqual({ count: 2 });
		expect(response.status).toBe(200);
	});

	it("maps notification request errors to public route responses", async () => {
		const response = await handleReadNotificationRoute(
			customerUser,
			"missing-notification",
			routeOperations({
				readNotificationForCurrentUser: async () => {
					throw new NotificationRequestError("Notification not found", {
						status: 404,
					});
				},
			}),
		);

		await expect(response.json()).resolves.toEqual({
			message: "Notification not found",
		});
		expect(response.status).toBe(404);
	});
});

function routeOperations(
	overrides: Partial<NotificationRouteOperations>,
): NotificationRouteOperations {
	return {
		getNotificationsForCurrentUser: async () => [],
		getUnreadNotificationCountForCurrentUser: async () => 0,
		readNotificationForCurrentUser: async (_user, input) =>
			makeNotification({ id: input.notificationId, isRead: true }),
		readAllNotificationsForCurrentUser: async () => ({ count: 0 }),
		...overrides,
	};
}

function makeNotification(
	overrides: Partial<NotificationReadModel> = {},
): NotificationReadModel {
	return {
		id: "notification-1",
		userId: "customer-1",
		purchaseId: null,
		sellerOrderId: null,
		message: "A notification",
		isRead: false,
		createdAt: "2026-06-23T00:00:00.000Z",
		...overrides,
	};
}
