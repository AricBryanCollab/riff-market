import { createFileRoute } from "@tanstack/react-router";
import { getNotificationsCountService } from "@/actions/notifications";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/notifications/unread/count")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			GET: async ({ context }) => {
				try {
					const userId = context.id;

					const notificationCount = await getNotificationsCountService(userId);

					return new Response(JSON.stringify({ count: notificationCount }), {
						status: 200,
					});
				} catch (error) {
					logger.error("Failed to count unread notifications", error);
					return new Response(
						JSON.stringify({
							error: "Failed to count notifications of the user",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
