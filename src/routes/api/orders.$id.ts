import { createFileRoute } from "@tanstack/react-router";
import { getOrderByIdService } from "@/actions/order";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/orders/$id")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			GET: async ({ params, context }) => {
				try {
					const { id } = params;
					const role = context.role;

					const order = await getOrderByIdService(role, id);

					if ("error" in order) {
						return new Response(
							JSON.stringify({
								error: order.error,
							}),
						);
					}

					return new Response(JSON.stringify(order), { status: 200 });
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: "Failed to get order by ID",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
					);
				}
			},
		},
	},
});
