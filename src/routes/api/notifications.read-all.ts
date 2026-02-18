import { createFileRoute } from "@tanstack/react-router";
import { readAllNotificationsService } from "@/actions/notifications";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/notifications/read-all")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			PUT: async ({ context }) => {
				try {
					const userId = context.id;

					const notification = await readAllNotificationsService(userId);

					if ("error" in notification) {
						return new Response(
							JSON.stringify({
								message:
									notification.error || "Failed to read all notifications",
							}),
							{ status: 400 },
						);
					}

					return new Response(JSON.stringify(notification), { status: 200 });
				} catch (error) {
					logger.error("Failed to read all notifications", error);
					return new Response(
						JSON.stringify({
							error: "Failed to read all notifications",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
