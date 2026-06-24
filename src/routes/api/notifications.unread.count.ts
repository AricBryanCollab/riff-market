import { createFileRoute } from "@tanstack/react-router";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { handleUnreadNotificationCountRoute } from "@/server/notification-route-handlers";

export const Route = createFileRoute("/api/notifications/unread/count")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			GET: async ({ context }) => handleUnreadNotificationCountRoute(context),
		},
	},
});
