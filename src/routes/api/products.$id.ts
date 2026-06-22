import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware } from "@/middleware";
import { getListingDetailsProductResponse } from "@/server/listing-read-service";

export const Route = createFileRoute("/api/products/$id")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ params }) => {
						try {
							const { id } = params;
							return await getListingDetailsProductResponse(id);
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
