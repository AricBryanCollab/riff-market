import { describe, expect, it } from "vitest";
import { createNotification } from "./notification-use-cases";

describe("notification use cases", () => {
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
