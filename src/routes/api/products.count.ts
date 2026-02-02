import { createFileRoute } from "@tanstack/react-router";
import {
	getProductCountByCategoryService,
	getProductCountByStatusService,
} from "@/actions/product";

export const Route = createFileRoute("/api/products/count")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const status = url.searchParams.get("status");

							// Count By Product Status as Approved/Pending
							if (status) {
								const isApproved = status === "approved";
								const productCounts =
									await getProductCountByStatusService(isApproved);
								return new Response(JSON.stringify(productCounts), {
									status: 200,
								});
							}

							// Count By Product Category
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
