import { createFileRoute } from "@tanstack/react-router";
import { getProductsBySellerService } from "@/actions/product";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/seller")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [authMiddleware],
					handler: async ({ context }) => {
						try {
							const products = await getProductsBySellerService(
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
