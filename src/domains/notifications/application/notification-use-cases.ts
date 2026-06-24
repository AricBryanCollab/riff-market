import type {
	CreateNotificationCommand,
	NotificationReadModel,
} from "@/domains/notifications/dto/notification";
import type { Actor } from "@/domains/shared/domain/actor";
import {
	type AppError,
	appError,
	err,
	ok,
	type Result,
} from "@/domains/shared/domain/result";

export type NotificationErrorCode =
	| "NOTIFICATION_INVALID_COMMAND"
	| "NOTIFICATION_NOT_FOUND";

export type NotificationError = AppError<NotificationErrorCode>;

export interface NotificationReadPort {
	listForUser(userId: string): Promise<NotificationReadModel[]>;
}

export interface NotificationCreatePort {
	create(command: CreateNotificationCommand): Promise<NotificationReadModel>;
}

export interface NotificationUnreadCountPort {
	countUnreadForUser(userId: string): Promise<number>;
}

export interface NotificationReadStatePort {
	markAsReadForUser(
		notificationId: string,
		userId: string,
	): Promise<NotificationReadModel | null>;
	markAllAsReadForUser(userId: string): Promise<{ readonly count: number }>;
}

export class GetNotifications {
	constructor(private readonly notifications: NotificationReadPort) {}

	async execute(
		actor: Actor,
	): Promise<Result<NotificationReadModel[], NotificationError>> {
		const validationError = validateRequired(actor.id, "User ID");
		if (validationError) {
			return err(validationError);
		}

		return ok(await this.notifications.listForUser(actor.id));
	}
}

export class CreateNotification {
	constructor(private readonly notifications: NotificationCreatePort) {}

	async execute(
		command: CreateNotificationCommand,
	): Promise<Result<NotificationReadModel, NotificationError>> {
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
			await this.notifications.create({
				...command,
				isRead: command.isRead ?? false,
			}),
		);
	}
}

export class ReadNotification {
	constructor(private readonly notifications: NotificationReadStatePort) {}

	async execute(command: {
		readonly notificationId: string;
		readonly actor: Actor;
	}): Promise<Result<NotificationReadModel, NotificationError>> {
		const notificationIdError = validateRequired(
			command.notificationId,
			"Notification ID",
		);
		if (notificationIdError) {
			return err(notificationIdError);
		}

		const userIdError = validateRequired(command.actor.id, "User ID");
		if (userIdError) {
			return err(userIdError);
		}

		const notification = await this.notifications.markAsReadForUser(
			command.notificationId,
			command.actor.id,
		);

		if (!notification) {
			return err(
				notificationError(
					"NOTIFICATION_NOT_FOUND",
					"Notification not found",
					"not-found",
				),
			);
		}

		return ok(notification);
	}
}

export class ReadAllNotifications {
	constructor(private readonly notifications: NotificationReadStatePort) {}

	async execute(
		actor: Actor,
	): Promise<Result<{ readonly count: number }, NotificationError>> {
		const userIdError = validateRequired(actor.id, "User ID");
		if (userIdError) {
			return err(userIdError);
		}

		return ok(await this.notifications.markAllAsReadForUser(actor.id));
	}
}

export class GetUnreadNotificationCount {
	constructor(private readonly notifications: NotificationUnreadCountPort) {}

	async execute(actor: Actor): Promise<Result<number, NotificationError>> {
		const userIdError = validateRequired(actor.id, "User ID");
		if (userIdError) {
			return err(userIdError);
		}

		return ok(await this.notifications.countUnreadForUser(actor.id));
	}
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
	return appError({
		code,
		message,
		kind,
	});
}
