import { createFileRoute } from "@tanstack/react-router";
import { getRecentProductsService } from "@/actions/product";

export const Route = createFileRoute("/api/products/recent")({
	server: {
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
							console.error(error);
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
