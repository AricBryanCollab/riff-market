import { createFileRoute } from "@tanstack/react-router";
import { getPendingApprovalProducts } from "@/data/product-repo";
import { logger } from "@/lib/logger";
import { requestLoggerMiddleware, roleMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/pending")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [roleMiddleware(["ADMIN"])],
					handler: async () => {
						try {
							const products = await getPendingApprovalProducts();

							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							logger.error("Failed to get pending products", error);
							return new Response(
								JSON.stringify({ mesage: "Failed to get pending products" }),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
