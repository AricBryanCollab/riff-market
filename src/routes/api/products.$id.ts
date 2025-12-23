import { createFileRoute } from "@tanstack/react-router";
import { getProductByIdService } from "@/actions/product";

export const Route = createFileRoute("/api/products/$id")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ params }) => {
						try {
							const { id } = params;

							const product = await getProductByIdService(id);

							return new Response(JSON.stringify(product), { status: 200 });
						} catch (error) {
							console.error(error);
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
