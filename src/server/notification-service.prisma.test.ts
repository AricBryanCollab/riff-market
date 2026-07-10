import type { PrismaClient } from "generated/prisma/client";
import { beforeEach, expect, it } from "vitest";
import { PrismaNotifications } from "@/domains/notifications/infrastructure/prisma-notifications";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	getNotificationsForCurrentUser,
	getUnreadNotificationCountForCurrentUser,
	readAllNotificationsForCurrentUser,
	readNotificationForCurrentUser,
} from "@/server/notification-service";
import type { RequestError } from "@/server/request-error";
import {
	describeDb,
	seedMarketplaceUsers,
	setupPrismaTestDatabase,
} from "@/test/prisma-vitest-support";

const customerUser: ServerUserContext = {
	id: "customer-1",
	email: "customer@example.com",
	firstName: "Pat",
	lastName: "Buyer",
	role: "CUSTOMER",
};

const sellerUser: ServerUserContext = {
	id: "seller-1",
	email: "seller-1@example.com",
	firstName: "A",
	lastName: "Seller",
	role: "SELLER",
};

describeDb("notification service Prisma integration", () => {
	let db: PrismaClient;
	const testDb = setupPrismaTestDatabase();

	beforeEach(async () => {
		db = testDb.client;
		await seedMarketplaceUsers(db);
	});

	it("lists the current user's notifications newest first", async () => {
		await seedNotifications(db);
		const notifications = new PrismaNotifications(db);

		const visibleNotifications = await getNotificationsForCurrentUser(
			customerUser,
			notifications,
		);

		expect(visibleNotifications.map((notification) => notification.id)).toEqual(
			["customer-read", "customer-unread"],
		);
	});

	it("counts unread notifications for the current user", async () => {
		await seedNotifications(db);
		const notifications = new PrismaNotifications(db);

		const count = await getUnreadNotificationCountForCurrentUser(
			customerUser,
			notifications,
		);

		expect(count).toBe(1);
	});

	it("rejects reading another user's notification", async () => {
		await seedNotifications(db);
		const notifications = new PrismaNotifications(db);

		await expect(
			readNotificationForCurrentUser(
				customerUser,
				{ notificationId: "seller-unread" },
				notifications,
			),
		).rejects.toMatchObject({
			name: "RequestError",
			status: 404,
			code: "NOTIFICATION_NOT_FOUND",
		} satisfies Partial<RequestError>);

		await expect(
			getUnreadNotificationCountForCurrentUser(sellerUser, notifications),
		).resolves.toBe(1);
	});

	it("marks one current-user notification as read", async () => {
		await seedNotifications(db);
		const notifications = new PrismaNotifications(db);

		const readNotification = await readNotificationForCurrentUser(
			customerUser,
			{ notificationId: "customer-unread" },
			notifications,
		);
		expect(readNotification).toMatchObject({
			id: "customer-unread",
			userId: "customer-1",
			isRead: true,
		});

		await expect(
			getUnreadNotificationCountForCurrentUser(customerUser, notifications),
		).resolves.toBe(0);
	});

	it("marks all current-user notifications as read", async () => {
		await seedNotifications(db);
		await db.notification.create({
			data: {
				id: "customer-unread-again",
				userId: "customer-1",
				message: "Another customer unread notification",
				isRead: false,
			},
		});
		const notifications = new PrismaNotifications(db);

		await expect(
			readAllNotificationsForCurrentUser(customerUser, notifications),
		).resolves.toEqual({ count: 2 });
		await expect(
			getUnreadNotificationCountForCurrentUser(customerUser, notifications),
		).resolves.toBe(0);
		await expect(
			getUnreadNotificationCountForCurrentUser(sellerUser, notifications),
		).resolves.toBe(1);
	});
});

async function seedNotifications(db: PrismaClient) {
	await db.notification.createMany({
		data: [
			{
				id: "customer-unread",
				userId: "customer-1",
				message: "Customer unread notification",
				isRead: false,
				createdAt: new Date("2026-06-23T00:01:00.000Z"),
			},
			{
				id: "customer-read",
				userId: "customer-1",
				message: "Customer read notification",
				isRead: true,
				createdAt: new Date("2026-06-23T00:02:00.000Z"),
			},
			{
				id: "seller-unread",
				userId: "seller-1",
				message: "Seller unread notification",
				isRead: false,
				createdAt: new Date("2026-06-23T00:03:00.000Z"),
			},
		],
	});
}
