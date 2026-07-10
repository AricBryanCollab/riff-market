import { z } from "zod";
import {
	getNotifications,
	getUnreadNotificationCount,
	type NotificationError,
	type NotificationQueryPort,
	type NotificationReadAllPort,
	type NotificationReadPort,
	type NotificationUnreadCountPort,
	readAllNotifications,
	readNotification,
} from "@/domains/notifications/application/notification-use-cases";
import type { NotificationView } from "@/domains/notifications/dto/notification";
import type { Actor } from "@/domains/shared/domain/actor";
import type { Result } from "@/domains/shared/domain/result";
import type { ServerUserContext } from "@/server/function-middleware";
import {
	RequestError,
	unwrapResultOrThrowRequestError,
} from "@/server/request-error";

const notificationIdInputSchema = z.object({
	notificationId: z.string().trim().min(1, "Notification ID is required"),
});

export type NotificationIdInput = z.infer<typeof notificationIdInputSchema>;

export type NotificationServiceDependencies = NotificationQueryPort &
	NotificationUnreadCountPort &
	NotificationReadPort &
	NotificationReadAllPort;
type NotificationActorContext = Pick<ServerUserContext, "id" | "role">;

export function validateNotificationIdInput(
	data: unknown,
): NotificationIdInput {
	const parsed = notificationIdInputSchema.safeParse(data);

	if (!parsed.success) {
		throw new RequestError("Invalid notification request", {
			details: z.flattenError(parsed.error),
		});
	}

	return parsed.data;
}

export async function getNotificationsForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationQueryPort,
): Promise<NotificationView[]> {
	return executeNotificationUseCase(
		user,
		dependencies,
		createPrismaNotificationDependencies,
		(notifications, actor) => getNotifications(actor, notifications),
	);
}

export async function getUnreadNotificationCountForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationUnreadCountPort,
): Promise<number> {
	return executeNotificationUseCase(
		user,
		dependencies,
		createPrismaNotificationDependencies,
		(notifications, actor) => getUnreadNotificationCount(actor, notifications),
	);
}

export async function getUnreadNotificationCountForOptionalUser(
	user: NotificationActorContext | null | undefined,
	dependencies?: NotificationUnreadCountPort,
): Promise<number> {
	if (!user) {
		return 0;
	}

	return executeNotificationUseCase(
		user,
		dependencies,
		createPrismaNotificationDependencies,
		(notifications, actor) => getUnreadNotificationCount(actor, notifications),
	);
}

export async function readNotificationForCurrentUser(
	user: ServerUserContext,
	input: NotificationIdInput,
	dependencies?: NotificationReadPort,
): Promise<NotificationView> {
	return executeNotificationUseCase(
		user,
		dependencies,
		createPrismaNotificationDependencies,
		(notifications, actor) =>
			readNotification(
				{
					notificationId: input.notificationId,
					actor,
				},
				notifications,
			),
	);
}

export async function readAllNotificationsForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationReadAllPort,
): Promise<{ readonly count: number }> {
	return executeNotificationUseCase(
		user,
		dependencies,
		createPrismaNotificationDependencies,
		(notifications, actor) => readAllNotifications(actor, notifications),
	);
}

async function executeNotificationUseCase<T, TNotifications>(
	user: NotificationActorContext,
	dependencies: TNotifications | undefined,
	createNotifications: () => Promise<TNotifications>,
	execute: (
		notifications: TNotifications,
		actor: Actor,
	) => Promise<Result<T, NotificationError>>,
): Promise<T> {
	const notifications = dependencies ?? (await createNotifications());
	const result = await execute(notifications, toActor(user));

	return unwrapResultOrThrowRequestError(result);
}

async function createPrismaNotificationDependencies(): Promise<NotificationServiceDependencies> {
	const [{ prisma }, { PrismaNotifications }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/notifications/infrastructure/prisma-notifications"),
	]);

	return new PrismaNotifications(prisma);
}

function toActor(user: NotificationActorContext): Actor {
	return {
		id: user.id,
		role: user.role,
	};
}
