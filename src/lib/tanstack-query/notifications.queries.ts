import { apiFetch } from "@/lib/tanstack-query/fetch";
import type { NotificationData } from "@/types/notification";

export function getUserNotifications() {
	return apiFetch<NotificationData>("/api/notifications", {
		method: "GET",
	});
}

export function getNotificationCount() {
	return apiFetch<{ count: number }>("/api/notifications/count", {
		method: "GET",
	});
}

export function readNotificationById(id: string) {
	return apiFetch<NotificationData>(`/api/notifications/${id}`, {
		method: "PUT",
	});
}

// To do:
// export function readAllNotifications() {
// 	return apiFetch
// }
