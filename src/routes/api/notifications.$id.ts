import { createFileRoute } from "@tanstack/react-router";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { handleReadNotificationRoute } from "@/server/notification-route-handlers";

export const Route = createFileRoute("/api/notifications/$id")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			PUT: async ({ context, params }) =>
				handleReadNotificationRoute(context, params.id),
		},
	},
});
