import { describe, expect, it } from "vitest";
import type { NotificationsPort } from "@/domains/notifications/application/notification-ports";
import type { NotificationView } from "@/domains/notifications/dto/notification";
import type { ServerUserContext } from "@/server/function-middleware";
import type { RequestError } from "@/server/request-error";
import {
	getNotificationsForCurrentUser,
	getUnreadNotificationCountForOptionalUser,
	readAllNotificationsForCurrentUser,
	readNotificationForCurrentUser,
} from "./notification-service";

const customerUser: ServerUserContext = {
	id: "customer-1",
	email: "customer@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

describe("notification server service", () => {
	it("gets notifications for the current user", async () => {
		const notifications = makeNotificationsPort([
			makeNotification({ id: "notification-1", userId: "customer-1" }),
			makeNotification({ id: "notification-2", userId: "seller-1" }),
		]);

		const result = await getNotificationsForCurrentUser(
			customerUser,
			notifications,
		);

		expect(result).toEqual([
			makeNotification({ id: "notification-1", userId: "customer-1" }),
		]);
	});

	it("returns zero unread notifications without a current user", async () => {
		await expect(getUnreadNotificationCountForOptionalUser(null)).resolves.toBe(
			0,
		);
	});

	it("gets unread notification count for an optional current user", async () => {
		const notifications = makeNotificationsPort([
			makeNotification({ id: "notification-1", userId: "customer-1" }),
			makeNotification({
				id: "notification-2",
				userId: "customer-1",
				isRead: true,
			}),
			makeNotification({ id: "notification-3", userId: "seller-1" }),
		]);

		await expect(
			getUnreadNotificationCountForOptionalUser(customerUser, notifications),
		).resolves.toBe(1);
	});

	it("maps missing notification reads to request errors", async () => {
		const notifications = makeNotificationsPort([
			makeNotification({ id: "notification-1", userId: "seller-1" }),
		]);

		await expect(
			readNotificationForCurrentUser(
				customerUser,
				{ notificationId: "notification-1" },
				notifications,
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 404,
			code: "NOTIFICATION_NOT_FOUND",
		} satisfies Partial<RequestError>);
	});

	it("marks all unread notifications for the current user as read", async () => {
		const notifications = makeNotificationsPort([
			makeNotification({ id: "notification-1", userId: "customer-1" }),
			makeNotification({ id: "notification-2", userId: "customer-1" }),
			makeNotification({ id: "notification-3", userId: "seller-1" }),
		]);

		await expect(
			readAllNotificationsForCurrentUser(customerUser, notifications),
		).resolves.toEqual({ count: 2 });
		await expect(
			getUnreadNotificationCountForOptionalUser(customerUser, notifications),
		).resolves.toBe(0);
	});
});

function makeNotificationsPort(
	notifications: NotificationView[],
): NotificationsPort {
	const items = [...notifications];

	return {
		listForUser: async (userId) =>
			items.filter((notification) => notification.userId === userId),
		create: async (command) => {
			const notification = makeNotification({
				id: `notification-${items.length + 1}`,
				userId: command.userId,
				purchaseId: command.purchaseId ?? null,
				sellerOrderId: command.sellerOrderId ?? null,
				message: command.message,
				isRead: command.isRead ?? false,
			});
			items.push(notification);
			return notification;
		},
		countUnreadForUser: async (userId) =>
			items.filter(
				(notification) =>
					notification.userId === userId && notification.isRead === false,
			).length,
		markAsReadForUser: async (notificationId, userId) => {
			const index = items.findIndex(
				(item) => item.id === notificationId && item.userId === userId,
			);

			if (index < 0) {
				return null;
			}

			const updated = { ...items[index], isRead: true };
			items[index] = updated;
			return updated;
		},
		markAllAsReadForUser: async (userId) => {
			let count = 0;

			for (const [index, notification] of items.entries()) {
				if (notification.userId !== userId || notification.isRead) {
					continue;
				}

				items[index] = { ...notification, isRead: true };
				count += 1;
			}

			return { count };
		},
	};
}

function makeNotification(
	overrides: Partial<NotificationView> = {},
): NotificationView {
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
