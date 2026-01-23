import {
	getNotificationsByUser,
	getNotificationsCount,
	readAllNotifications,
	readNotificationById,
} from "@/data/notification";

export async function getNotificationsByUserService(userId: string) {
	if (!userId) {
		return {
			error: "User ID not found",
		};
	}

	return await getNotificationsByUser(userId);
}

export async function getNotificationsCountService(userId: string) {
	if (!userId) {
		return {
			error: "User ID not found",
		};
	}

	return await getNotificationsCount(userId);
}

export async function readNotificationsByIdService(notificationId: string) {
	if (!notificationId) {
		return {
			error: "Notification ID is required",
		};
	}

	return await readNotificationById(notificationId);
}

export async function readAllNotificationsService(userId: string) {
	if (!userId) {
		return {
			error: "User ID not found",
		};
	}

	return await readAllNotifications(userId);
}
