import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { getSellerListingsForProductApi } from "@/server/listing-read-service";

export const Route = createFileRoute("/api/products/seller")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [authMiddleware],
					handler: async ({ context }) => {
						try {
							const products = await getSellerListingsForProductApi(
								context.id,
								context.role,
							);
							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							logger.error("Failed to get products by seller", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get the products by seller",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
