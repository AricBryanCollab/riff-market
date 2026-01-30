import { createFileRoute } from "@tanstack/react-router";
import { getProductCountByCategoryService } from "@/actions/product";

export const Route = createFileRoute("/api/products/count")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async () => {
						try {
							const productCounts = await getProductCountByCategoryService();

							return new Response(JSON.stringify(productCounts), {
								status: 200,
							});
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to get the product counts by category",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
