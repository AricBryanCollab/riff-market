import { createFileRoute } from "@tanstack/react-router";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { handleListNotificationsRoute } from "@/server/notification-route-handlers";

export const Route = createFileRoute("/api/notifications")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			GET: async ({ context }) => handleListNotificationsRoute(context),
		},
	},
});
