import { z } from "zod";
import type { NotificationsPort } from "@/domains/notifications/application/notification-ports";
import type { NotificationView } from "@/domains/notifications/dto/notification";
import type { ServerUserContext } from "@/server/function-middleware";
import { RequestError } from "@/server/request-error";

const notificationIdInputSchema = z.object({
	notificationId: z.string().trim().min(1, "Notification ID is required"),
});

export type NotificationIdInput = z.infer<typeof notificationIdInputSchema>;

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
	dependencies?: NotificationsPort,
): Promise<NotificationView[]> {
	const notifications =
		dependencies ?? (await createPrismaNotificationDependencies());

	return notifications.listForUser(user.id);
}

export async function getUnreadNotificationCountForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationsPort,
): Promise<number> {
	const notifications =
		dependencies ?? (await createPrismaNotificationDependencies());

	return notifications.countUnreadForUser(user.id);
}

export async function getUnreadNotificationCountForOptionalUser(
	user: NotificationActorContext | null | undefined,
	dependencies?: NotificationsPort,
): Promise<number> {
	if (!user) {
		return 0;
	}

	const notifications =
		dependencies ?? (await createPrismaNotificationDependencies());

	return notifications.countUnreadForUser(user.id);
}

export async function readNotificationForCurrentUser(
	user: ServerUserContext,
	input: NotificationIdInput,
	dependencies?: NotificationsPort,
): Promise<NotificationView> {
	const notifications =
		dependencies ?? (await createPrismaNotificationDependencies());
	const notification = await notifications.markAsReadForUser(
		input.notificationId,
		user.id,
	);

	if (!notification) {
		throw new RequestError("Notification not found", {
			code: "NOTIFICATION_NOT_FOUND",
			status: 404,
		});
	}

	return notification;
}

export async function readAllNotificationsForCurrentUser(
	user: ServerUserContext,
	dependencies?: NotificationsPort,
): Promise<{ readonly count: number }> {
	const notifications =
		dependencies ?? (await createPrismaNotificationDependencies());

	return notifications.markAllAsReadForUser(user.id);
}

async function createPrismaNotificationDependencies(): Promise<NotificationsPort> {
	const [{ prisma }, { PrismaNotifications }] = await Promise.all([
		import("@/data/connect-db"),
		import("@/domains/notifications/infrastructure/prisma-notifications"),
	]);

	return new PrismaNotifications(prisma);
}
