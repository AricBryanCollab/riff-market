import type {
	CreateNotificationCommand,
	NotificationView,
} from "@/domains/notifications/dto/notification";

export interface NotificationsPort {
	listForUser(userId: string): Promise<NotificationView[]>;
	create(command: CreateNotificationCommand): Promise<NotificationView>;
	countUnreadForUser(userId: string): Promise<number>;
	markAsReadForUser(
		notificationId: string,
		userId: string,
	): Promise<NotificationView | null>;
	markAllAsReadForUser(userId: string): Promise<{ readonly count: number }>;
}

export type NotificationCreatePort = Pick<NotificationsPort, "create">;
