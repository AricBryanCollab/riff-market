import { createFileRoute } from "@tanstack/react-router";
import { getPendingApprovalProducts } from "@/data/product.repo";
import { roleMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/pending")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [roleMiddleware(["ADMIN"])],
					handler: async () => {
						try {
							const products = await getPendingApprovalProducts();

							return new Response(JSON.stringify(products), { status: 200 });
						} catch (error) {
							console.error(error);
							return new Response(JSON.stringify({}), { status: 500 });
						}
					},
				},
			}),
	},
});
