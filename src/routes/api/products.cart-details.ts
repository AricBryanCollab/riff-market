import { createFileRoute } from "@tanstack/react-router";
import { getProductsByIdsService } from "@/actions/product";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/cart-details")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			GET: async ({ request, context }) => {
				try {
					const url = new URL(request.url);
					const ids = url.searchParams.getAll("ids");

					const products = await getProductsByIdsService(context.role, { ids });

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
					return new Response(
						JSON.stringify({
							error: "Failed to get cart product details",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
