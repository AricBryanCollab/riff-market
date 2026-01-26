import { createFileRoute } from "@tanstack/react-router";
import { readNotificationsByIdService } from "@/actions/notifications";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/notifications/$id")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			PUT: async ({ params }) => {
				try {
					const { id } = params;

					const notification = readNotificationsByIdService(id);

					if ("error" in notification) {
						return new Response(
							JSON.stringify({
								message:
									notification.error || "Failed to read the notification",
							}),
							{ status: 400 },
						);
					}

					return new Response(JSON.stringify(notification), { status: 200 });
				} catch (error) {
					console.error(error);
					return new Response(
						JSON.stringify({
							error: "Failed to read the notification",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
