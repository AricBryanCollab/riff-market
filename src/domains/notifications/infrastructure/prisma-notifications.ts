import type { Prisma, PrismaClient } from "generated/prisma/client";
import type {
	NotificationCreatePort,
	NotificationReadPort,
	NotificationReadStatePort,
	NotificationUnreadCountPort,
} from "@/domains/notifications/application/notification-use-cases";
import type {
	CreateNotificationCommand,
	NotificationReadModel,
} from "@/domains/notifications/dto/notification";

type NotificationPrisma = Pick<PrismaClient, "notification">;

const notificationReadSelect = {
	id: true,
	userId: true,
	purchaseId: true,
	sellerOrderId: true,
	message: true,
	isRead: true,
	createdAt: true,
} satisfies Prisma.NotificationSelect;

type NotificationRow = Prisma.NotificationGetPayload<{
	select: typeof notificationReadSelect;
}>;

export class PrismaNotifications
	implements
		NotificationCreatePort,
		NotificationReadPort,
		NotificationUnreadCountPort,
		NotificationReadStatePort
{
	constructor(private readonly db: NotificationPrisma) {}

	async create(
		command: CreateNotificationCommand,
	): Promise<NotificationReadModel> {
		const notification = await this.db.notification.create({
			data: {
				userId: command.userId,
				purchaseId: command.purchaseId ?? null,
				sellerOrderId: command.sellerOrderId ?? null,
				message: command.message,
				isRead: command.isRead ?? false,
			},
			select: notificationReadSelect,
		});

		return toNotificationReadModel(notification);
	}

	async listForUser(userId: string): Promise<NotificationReadModel[]> {
		const notifications = await this.db.notification.findMany({
			where: { userId },
			select: notificationReadSelect,
			orderBy: { createdAt: "desc" },
		});

		return notifications.map(toNotificationReadModel);
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
	): Promise<NotificationReadModel | null> {
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
			select: notificationReadSelect,
		});

		return toNotificationReadModel(updated);
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

function toNotificationReadModel(
	notification: NotificationRow,
): NotificationReadModel {
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
