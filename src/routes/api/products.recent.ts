import { createFileRoute } from "@tanstack/react-router";
import { getRecentProductsService } from "@/actions/product";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/recent")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async () => {
						try {
							const recentProducts = await getRecentProductsService();
							return new Response(JSON.stringify(recentProducts), {
								status: 200,
							});
						} catch (error) {
							logger.error("Failed to get recent products", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get the recent products",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
