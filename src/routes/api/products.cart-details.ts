import { createFileRoute } from "@tanstack/react-router";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";
import { getCartListingsForProductApi } from "@/server/listing-read-service";

export const Route = createFileRoute("/api/products/cart-details")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			GET: async ({ request, context }) => {
				try {
					const url = new URL(request.url);
					const ids = url.searchParams.getAll("ids");

					const products = await getCartListingsForProductApi(context.role, {
						ids,
					});

					if ("error" in products) {
						return new Response(
							JSON.stringify({
								message: products.error,
								details: products.details,
							}),
							{ status: 400 },
						);
					}

					return new Response(JSON.stringify(products), { status: 200 });
				} catch (error) {
					logger.error("Failed to get cart product details", error);
					return new Response(
						JSON.stringify({
							message: "Failed to get cart product details",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
