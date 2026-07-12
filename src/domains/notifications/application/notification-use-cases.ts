import type {
	CreateNotificationCommand,
	NotificationView,
} from "@/domains/notifications/dto/notification";

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
