import type {
	CreateNotificationCommand,
	NotificationReadModel,
} from "@/domains/notifications/dto/notification";

export type NotificationData = NotificationReadModel;
export type CreateNotificationData = CreateNotificationCommand;
