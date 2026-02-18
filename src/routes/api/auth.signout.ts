import { createFileRoute } from "@tanstack/react-router";
import { signOutService } from "@/actions/auth";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/auth/signout")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: {
			POST: async () => {
				try {
					await signOutService();

					return new Response(
						JSON.stringify({ message: "Sign out is successful" }),
					);
				} catch (error) {
					logger.error("Failed to sign out", error);
					return new Response(
						JSON.stringify({
							message: "Failed to sign out data",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
