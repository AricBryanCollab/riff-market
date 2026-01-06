import { createFileRoute } from "@tanstack/react-router";
import { createOrderService } from "@/actions/order";
import type { OrderRequest } from "@/types/order";

export const Route = createFileRoute("/api/orders")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const body = (await request.json()) as OrderRequest;

					const order = await createOrderService(body);

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
