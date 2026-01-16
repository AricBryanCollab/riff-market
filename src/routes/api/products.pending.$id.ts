import { createFileRoute } from "@tanstack/react-router";
import { updateProductStatusService } from "@/actions/product";
import { roleMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/products/pending/$id")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				PUT: {
					middleware: [roleMiddleware(["ADMIN"])],
					handler: async ({ request, params }) => {
						try {
							const { id } = params;

							if (!id) {
								return new Response(
									JSON.stringify({
										message: "No ID provided upon request",
									}),
								);
							}

							const body = await request.json();
							const validation = await updateProductStatusService(id, body);

							if ("error" in validation) {
								return new Response(
									JSON.stringify({
										message:
											validation.error || "Failed to update the product status",
									}),
									{ status: 400 },
								);
							}
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to update the product status",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
