import type { Prisma } from "generated/prisma/client";
import { prisma } from "@/data/connect-db";
import { logger } from "@/lib/logger";
import type {
	CreateNotificationData,
	NotificationData,
} from "@/types/notification";

const notificationDtoSelect = {
	id: true,
	userId: true,
	purchaseId: true,
	sellerOrderId: true,
	message: true,
	isRead: true,
	createdAt: true,
} satisfies Prisma.NotificationSelect;

export const createNotification = async (
	notificationData: CreateNotificationData,
	prismaClient: Prisma.TransactionClient | typeof prisma = prisma,
) => {
	try {
		const notification = await prismaClient.notification.create({
			data: {
				...notificationData,
			},
			select: notificationDtoSelect,
		});

		return toNotificationDto(notification);
	} catch (err) {
		logger.error("Error at createNotification", err);
		throw err;
	}
};

export const getNotificationsByUser = async (userId: string) => {
	try {
		const notifications = await prisma.notification.findMany({
			where: { userId },
			select: notificationDtoSelect,
			orderBy: {
				createdAt: "desc",
			},
		});

		return notifications.map(toNotificationDto);
	} catch (err) {
		logger.error("Error at getNotificationsByUser", err);
		throw err;
	}
};

export const getNotificationsCount = async (userId: string) => {
	try {
		return await prisma.notification.count({
			where: {
				userId,
				isRead: false,
			},
		});
	} catch (err) {
		logger.error("Error at getNotificationsCount", err);
		throw err;
	}
};

export const readNotificationById = async (notificationId: string) => {
	try {
		const notification = await prisma.notification.update({
			where: { id: notificationId },
			data: {
				isRead: true,
			},
			select: notificationDtoSelect,
		});

		return toNotificationDto(notification);
	} catch (err) {
		logger.error("Error at readNotificationsById", err);
		throw err;
	}
};

export const readAllNotifications = async (userId: string) => {
	try {
		const notifications = await prisma.notification.findMany({
			where: { userId, isRead: false },
			select: { id: true },
		});

		if (notifications.length === 0) {
			return { count: 0 };
		}

		const result = await prisma.notification.updateMany({
			where: { userId, isRead: false },
			data: {
				isRead: true,
			},
		});

		return result;
	} catch (err) {
		logger.error("Error at readAllNotifications", err);
		throw err;
	}
};

function toNotificationDto(
	notification: Prisma.NotificationGetPayload<{
		select: typeof notificationDtoSelect;
	}>,
): NotificationData {
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
