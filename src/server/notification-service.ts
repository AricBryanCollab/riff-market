import { z } from "zod";
import {
	GetNotifications,
	GetUnreadNotificationCount,
	type NotificationError,
	type NotificationReadPort,
	type NotificationReadStatePort,
	type NotificationUnreadCountPort,
	ReadAllNotifications,
	ReadNotification,
} from "@/domains/notifications/application/notification-use-cases";
import type { NotificationReadModel } from "@/domains/notifications/dto/notification";
import type { Actor } from "@/domains/shared/domain/actor";
import type { Result } from "@/domains/shared/domain/result";
import { toAppErrorStatus } from "@/server/app-error-status";
import type { ServerUserContext } from "@/server/function-middleware";

const notificationIdInputSchema = z.object({
	notificationId: z.string().trim().min(1, "Notification ID is required"),
});

export type NotificationIdInput = z.infer<typeof notificationIdInputSchema>;

export type NotificationServiceDependencies = NotificationReadPort &
	NotificationUnreadCountPort &
	NotificationReadStatePort;

export class NotificationRequestError extends Error {
	readonly code?: string;
	readonly details?: unknown;
	readonly status: number;

	constructor(
		message: string,
		options: { code?: string; details?: unknown; status?: number } = {},
	) {
		super(message);
		this.name = "NotificationRequestError";
		this.code = options.code;
		this.details = options.details;
		this.status = options.status ?? 400;
	}
}

export function validateNotificationIdInput(
	data: unknown,
): NotificationIdInput {
	const parsed = notificationIdInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new NotificationRequestError("Invalid notification request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function getNotificationsForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationServiceDependencies,
): Promise<NotificationReadModel[]> {
	return executeNotificationUseCase(
		user,
		dependencies,
		(notifications, actor) =>
			new GetNotifications(notifications).execute(actor),
	);
}

export async function getUnreadNotificationCountForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationServiceDependencies,
): Promise<number> {
	return executeNotificationUseCase(
		user,
		dependencies,
		(notifications, actor) =>
			new GetUnreadNotificationCount(notifications).execute(actor),
	);
}

export async function readNotificationForCurrentUser(
	user: ServerUserContext,
	input: NotificationIdInput,
	dependencies?: NotificationServiceDependencies,
): Promise<NotificationReadModel> {
	return executeNotificationUseCase(
		user,
		dependencies,
		(notifications, actor) =>
			new ReadNotification(notifications).execute({
				notificationId: input.notificationId,
				actor,
			}),
	);
}

export async function readAllNotificationsForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationServiceDependencies,
): Promise<{ readonly count: number }> {
	return executeNotificationUseCase(
		user,
		dependencies,
		(notifications, actor) =>
			new ReadAllNotifications(notifications).execute(actor),
	);
}

async function executeNotificationUseCase<T>(
	user: ServerUserContext,
	dependencies: NotificationServiceDependencies | undefined,
	execute: (
		notifications: NotificationServiceDependencies,
		actor: Actor,
	) => Promise<Result<T, NotificationError>>,
): Promise<T> {
	const notifications =
		dependencies ?? (await createPrismaNotificationDependencies());
	const result = await execute(notifications, toActor(user));
	if (!result.ok) {
		throw toNotificationRequestError(result.error);
	}

	return result.value;
}

async function createPrismaNotificationDependencies(): Promise<NotificationServiceDependencies> {
	const [{ prisma }, { PrismaNotifications }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/notifications/infrastructure/prisma-notifications"),
	]);

	return new PrismaNotifications(prisma);
}

function toActor(user: ServerUserContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}

function toNotificationRequestError(error: NotificationError) {
	return new NotificationRequestError(error.message, {
		code: error.code,
		details: error.details,
		status: toAppErrorStatus(error.kind),
	});
}
