import { describe, expect, it } from "vitest";
import type { NotificationReadModel } from "@/domains/notifications/dto/notification";
import type { ServerUserContext } from "@/server/function-middleware";
import type { RequestError } from "@/server/request-error";
import {
	getNotificationsForCurrentUser,
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
		const notifications = new InMemoryNotifications([
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

	it("maps missing notification reads to request errors", async () => {
		const notifications = new InMemoryNotifications([
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
});

class InMemoryNotifications {
	constructor(private readonly notifications: NotificationReadModel[]) {}

	async listForUser(userId: string) {
		return this.notifications.filter(
			(notification) => notification.userId === userId,
		);
	}

	async countUnreadForUser(userId: string) {
		return this.notifications.filter(
			(notification) =>
				notification.userId === userId && notification.isRead === false,
		).length;
	}

	async markAsReadForUser(notificationId: string, userId: string) {
		const notification = this.notifications.find(
			(item) => item.id === notificationId && item.userId === userId,
		);

		return notification ? { ...notification, isRead: true } : null;
	}

	async markAllAsReadForUser(userId: string) {
		const count = this.notifications.filter(
			(notification) =>
				notification.userId === userId && notification.isRead === false,
		).length;

		return { count };
	}

	async create() {
		throw new Error("Not needed for read service tests");
	}
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
