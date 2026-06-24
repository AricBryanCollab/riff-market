import { createFileRoute } from "@tanstack/react-router";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { handleReadAllNotificationsRoute } from "@/server/notification-route-handlers";

export const Route = createFileRoute("/api/notifications/read-all")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			PUT: async ({ context }) => handleReadAllNotificationsRoute(context),
		},
	},
});
