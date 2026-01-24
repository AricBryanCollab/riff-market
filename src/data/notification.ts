import type { Prisma } from "generated/prisma/client";
import { prisma } from "@/data/connectDb";
import type { NotificationData } from "@/types/notification";

export const createNotification = async (
	notificationData: NotificationData,
	prismaClient: Prisma.TransactionClient | typeof prisma = prisma,
) => {
	try {
		return await prismaClient.notification.create({
			data: {
				...notificationData,
				orderId: notificationData.orderId || undefined,
			},
		});
	} catch (err) {
		console.error("Error at createNotification", err);
		throw err;
	}
};

export const getNotificationsByUser = async (userId: string) => {
	try {
		return await prisma.notification.findMany({
			where: { userId },
			orderBy: {
				createdAt: "desc",
			},
		});
	} catch (err) {
		console.error("Error at getNotificationsByUser", err);
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
		console.error("Error at getNotificationsCount", err);
		throw err;
	}
};

export const readNotificationById = async (notificationId: string) => {
	try {
		return await prisma.notification.update({
			where: { id: notificationId },
			data: {
				isRead: true,
			},
		});
	} catch (err) {
		console.error("Error at readNotificationsById", err);
		throw err;
	}
};

export const readAllNotifications = async (userId: string) => {
	try {
		return await prisma.notification.updateMany({
			where: { userId, isRead: false },
			data: {
				isRead: true,
			},
		});
	} catch (err) {
		console.error("Error at readAllNotifications", err);
		throw err;
	}
};
