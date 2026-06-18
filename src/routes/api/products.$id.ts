import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { getProductByIdResponse } from "@/server/product-read-service";

export const Route = createFileRoute("/api/products/$id")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [authMiddleware],
					handler: async ({ params }) => {
						try {
							const { id } = params;
							return await getProductByIdResponse(id);
						} catch (error) {
							logger.error("Failed to get product by ID", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get the product by ID",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
