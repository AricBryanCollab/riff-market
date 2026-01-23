import { createFileRoute } from "@tanstack/react-router";
import { readAllNotificationsService } from "@/actions/notifications";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/notfiications/read-all")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			PUT: async ({ context }) => {
				try {
					const userId = context.id;

					const notification = readAllNotificationsService(userId);

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
					JSON.stringify({
						error: "Failed to read all notifications",
						details: error instanceof Error ? error.message : "Unknown error",
					});
				}
			},
		},
	},
});
