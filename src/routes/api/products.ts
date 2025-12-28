import { createFileRoute } from "@tanstack/react-router";
import {
	createProductService,
	getApprovedProductsService,
} from "@/actions/product";

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
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to get all approved products",
								}),
								{ status: 500 },
							);
						}
					},
				},
				POST: {
					handler: async ({ request }) => {
						try {
							const body = await request.json();

							const newProduct = await createProductService(body);

							if ("error" in newProduct) {
								return new Response(
									JSON.stringify({ error: newProduct.error }),
									{
										status: 400,
									},
								);
							}

							return new Response(JSON.stringify(newProduct), { status: 201 });
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message:
										error instanceof Error
											? error.message
											: "Failed to create the product",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
