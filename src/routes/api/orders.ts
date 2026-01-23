import { createFileRoute } from "@tanstack/react-router";
import { createOrderService } from "@/actions/order";
import { authMiddleware } from "@/middleware";
import type { OrderRequest } from "@/types/order";

export const Route = createFileRoute("/api/orders")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			POST: async ({ request, context }) => {
				try {
					const userId = context.id;
					const body = (await request.json()) as OrderRequest;

					const order = await createOrderService(userId, body);

					if ("error" in order) {
						return new Response(JSON.stringify({ error: order.error }), {
							status: 400,
						});
					}

					return new Response(
						JSON.stringify({
							message: "An order has been placed",
							order: order,
						}),
						{ status: 200 },
					);
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: "Invalid request data",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
