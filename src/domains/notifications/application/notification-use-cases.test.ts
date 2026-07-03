import { describe, expect, it } from "vitest";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	createNotification,
	getNotifications,
	getUnreadNotificationCount,
	readAllNotifications,
	readNotification,
} from "./notification-use-cases";

describe("notification use cases", () => {
	const userOne: Actor = { id: "user-1", role: "CUSTOMER" };

	it("gets notifications for a user", async () => {
		const notifications = new InMemoryNotifications([
			makeNotification({ id: "notification-1", userId: "user-1" }),
			makeNotification({ id: "notification-2", userId: "user-2" }),
		]);

		const result = await getNotifications(userOne, notifications);

		expect(result).toEqual({
			ok: true,
			value: [makeNotification({ id: "notification-1", userId: "user-1" })],
		});
	});

	it("does not mark another user's notification as read", async () => {
		const notifications = new InMemoryNotifications([
			makeNotification({ id: "notification-1", userId: "user-2" }),
		]);

		const result = await readNotification(
			{
				notificationId: "notification-1",
				actor: userOne,
			},
			notifications,
		);

		expect(result).toMatchObject({
			ok: false,
			error: {
				code: "NOTIFICATION_NOT_FOUND",
				kind: "not-found",
			},
		});
		expect(notifications.items).toEqual([
			makeNotification({ id: "notification-1", userId: "user-2" }),
		]);
	});

	it("marks all unread notifications for a user as read", async () => {
		const notifications = new InMemoryNotifications([
			makeNotification({ id: "notification-1", userId: "user-1" }),
			makeNotification({ id: "notification-2", userId: "user-1" }),
			makeNotification({ id: "notification-3", userId: "user-2" }),
		]);

		const result = await readAllNotifications(userOne, notifications);
		const unreadCount = await getUnreadNotificationCount(
			userOne,
			notifications,
		);

		expect(result).toEqual({ ok: true, value: { count: 2 } });
		expect(unreadCount).toEqual({ ok: true, value: 0 });
		expect(notifications.items).toEqual([
			makeNotification({
				id: "notification-1",
				userId: "user-1",
				isRead: true,
			}),
			makeNotification({
				id: "notification-2",
				userId: "user-1",
				isRead: true,
			}),
			makeNotification({ id: "notification-3", userId: "user-2" }),
		]);
	});

	it("creates unread notifications", async () => {
		const notifications = new InMemoryNotifications([]);

		const result = await createNotification(
			{
				userId: "user-1",
				purchaseId: "purchase-1",
				sellerOrderId: null,
				message: "Your purchase has been placed.",
			},
			notifications,
		);

		expect(result).toEqual({
			ok: true,
			value: makeNotification({
				id: "notification-1",
				userId: "user-1",
				purchaseId: "purchase-1",
				message: "Your purchase has been placed.",
			}),
		});
		expect(notifications.items).toEqual([
			makeNotification({
				id: "notification-1",
				userId: "user-1",
				purchaseId: "purchase-1",
				message: "Your purchase has been placed.",
			}),
		]);
	});
});

type NotificationView = {
	readonly id: string;
	readonly userId: string;
	readonly purchaseId: string | null;
	readonly sellerOrderId: string | null;
	readonly message: string;
	readonly isRead: boolean;
	readonly createdAt: string;
};

class InMemoryNotifications {
	items: NotificationView[];

	constructor(notifications: NotificationView[]) {
		this.items = notifications;
	}

	async listForUser(userId: string) {
		return this.items.filter((notification) => notification.userId === userId);
	}

	async markAsReadForUser(notificationId: string, userId: string) {
		const index = this.items.findIndex(
			(notification) =>
				notification.id === notificationId && notification.userId === userId,
		);

		if (index === -1) {
			return null;
		}

		const notification = {
			...this.items[index],
			isRead: true,
		};
		this.items[index] = notification;

		return notification;
	}

	async markAllAsReadForUser(userId: string) {
		let count = 0;
		this.items = this.items.map((notification) => {
			if (notification.userId !== userId || notification.isRead) {
				return notification;
			}

			count += 1;
			return { ...notification, isRead: true };
		});

		return { count };
	}

	async countUnreadForUser(userId: string) {
		return this.items.filter(
			(notification) =>
				notification.userId === userId && notification.isRead === false,
		).length;
	}

	async create(command: {
		readonly userId: string;
		readonly purchaseId?: string | null;
		readonly sellerOrderId?: string | null;
		readonly message: string;
		readonly isRead?: boolean;
	}) {
		const notification = makeNotification({
			id: `notification-${this.items.length + 1}`,
			userId: command.userId,
			purchaseId: command.purchaseId ?? null,
			sellerOrderId: command.sellerOrderId ?? null,
			message: command.message,
			isRead: command.isRead ?? false,
		});
		this.items.unshift(notification);

		return notification;
	}
}

function makeNotification(
	overrides: Partial<NotificationView> = {},
): NotificationView {
	return {
		id: "notification-1",
		userId: "user-1",
		purchaseId: null,
		sellerOrderId: null,
		message: "A notification",
		isRead: false,
		createdAt: "2026-06-23T00:00:00.000Z",
		...overrides,
	};
}
