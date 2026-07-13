import type { Prisma, PrismaClient } from "generated/prisma/client";
import type { NotificationsPort } from "@/domains/notifications/application/notification-ports";
import type {
	CreateNotificationCommand,
	NotificationView,
} from "@/domains/notifications/dto/notification";

type NotificationPrisma = Pick<PrismaClient, "notification">;

const notificationViewSelect = {
	id: true,
	userId: true,
	purchaseId: true,
	sellerOrderId: true,
	message: true,
	isRead: true,
	createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{
	select: typeof notificationViewSelect;
}>;

export class PrismaNotifications implements NotificationsPort {
	constructor(private readonly db: NotificationPrisma) {}

	async create(command: CreateNotificationCommand): Promise<NotificationView> {
		const notification = await this.db.notification.create({
			data: {
				userId: command.userId,
				purchaseId: command.purchaseId ?? null,
				sellerOrderId: command.sellerOrderId ?? null,
				message: command.message,
				isRead: command.isRead ?? false,
			},
			select: notificationViewSelect,
		});

		return toNotificationView(notification);
	}

	async listForUser(userId: string): Promise<NotificationView[]> {
		const notifications = await this.db.notification.findMany({
			where: { userId },
			select: notificationViewSelect,
			orderBy: { createdAt: "desc" },
		});

		return notifications.map(toNotificationView);
	}

	async countUnreadForUser(userId: string): Promise<number> {
		return await this.db.notification.count({
			where: {
				userId,
				isRead: false,
			},
		});
	}

	async markAsReadForUser(
		notificationId: string,
		userId: string,
	): Promise<NotificationView | null> {
		const notification = await this.db.notification.findFirst({
			where: {
				id: notificationId,
				userId,
			},
			select: { id: true },
		});

		if (!notification) {
			return null;
		}

		const updated = await this.db.notification.update({
			where: { id: notification.id },
			data: { isRead: true },
			select: notificationViewSelect,
		});

		return toNotificationView(updated);
	}

	async markAllAsReadForUser(
		userId: string,
	): Promise<{ readonly count: number }> {
		const result = await this.db.notification.updateMany({
			where: {
				userId,
				isRead: false,
			},
			data: {
				isRead: true,
			},
		});

		return { count: result.count };
	}
}

function toNotificationView(notification: NotificationRow): NotificationView {
	return {
		id: notification.id,
		userId: notification.userId,
		purchaseId: notification.purchaseId,
		sellerOrderId: notification.sellerOrderId,
		message: notification.message,
		isRead: notification.isRead,
		createdAt: notification.createdAt.toISOString(),
	};
}
