import { createFileRoute } from "@tanstack/react-router";
import { getProductsBySellerService } from "@/actions/product";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/seller")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [authMiddleware],
					handler: async () => {
						try {
							const products = await getProductsBySellerService();
							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							console.error(error);
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
