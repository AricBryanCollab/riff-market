import { createFileRoute } from "@tanstack/react-router";
import { getProductByIdService } from "@/actions/product";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

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

							const product = await getProductByIdService(id);

							return new Response(JSON.stringify(product), { status: 200 });
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
