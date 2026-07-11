import type {
	CreateNotificationCommand,
	NotificationView,
} from "@/domains/notifications/dto/notification";
import {
	type AppError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type NotificationErrorCode = "NOTIFICATION_INVALID_COMMAND";

export type NotificationError = AppError<NotificationErrorCode>;

export interface NotificationQueryPort {
	listForUser(userId: string): Promise<NotificationView[]>;
}

export interface NotificationCreatePort {
	create(command: CreateNotificationCommand): Promise<NotificationView>;
}

export interface NotificationUnreadCountPort {
	countUnreadForUser(userId: string): Promise<number>;
}

export interface NotificationReadPort {
	markAsReadForUser(
		notificationId: string,
		userId: string,
	): Promise<NotificationView | null>;
}

export interface NotificationReadAllPort {
	markAllAsReadForUser(userId: string): Promise<{ readonly count: number }>;
}

export type NotificationReadStatePort = NotificationReadPort &
	NotificationReadAllPort;

export async function createNotification(
	command: CreateNotificationCommand,
	notifications: NotificationCreatePort,
): Promise<Result<NotificationView, NotificationError>> {
	const userIdError = validateRequired(command.userId, "User ID");
	if (userIdError) {
		return err(userIdError);
	}

	const messageError = validateRequired(
		command.message,
		"Notification message",
	);
	if (messageError) {
		return err(messageError);
	}

	return ok(
		await notifications.create({
			...command,
			isRead: command.isRead ?? false,
		}),
	);
}

function validateRequired(value: string, label: string) {
	if (value.trim().length > 0) {
		return undefined;
	}

	return notificationError(
		"NOTIFICATION_INVALID_COMMAND",
		`${label} is required`,
		"validation",
	);
}

function notificationError(
	code: NotificationErrorCode,
	message: string,
	kind: NotificationError["kind"],
): NotificationError {
	return {
		code,
		message,
		kind,
	};
}
