import { createFileRoute } from "@tanstack/react-router";
import { getNotificationsByUserService } from "@/actions/notifications";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/notifications")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			GET: async ({ context }) => {
				try {
					const userId = context.id;

					const notifications = await getNotificationsByUserService(userId);

					if ("error" in notifications) {
						return new Response(
							JSON.stringify({
								message: notifications.error || "Failed to get notifications",
							}),
							{ status: 400 },
						);
					}

					return new Response(JSON.stringify(notifications), { status: 200 });
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: "Failed to get notifications",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
