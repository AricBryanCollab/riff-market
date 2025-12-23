import { createFileRoute } from "@tanstack/react-router";
import { getApprovedProductsService } from "@/actions/product";

export const Route = createFileRoute("/api/products")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async () => {
						try {
							const products = await getApprovedProductsService();

							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							console.error(error)
							return new Response(
								JSON.stringify({
									message: "Failed to get all approved products",
								}),
								{ status: 500 },
							)
						}
					},
				},
			}),
	},
});
