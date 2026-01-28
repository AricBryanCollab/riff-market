import { createFileRoute } from "@tanstack/react-router";
import {
	createOrderService,
	getOrdersByCustomerService,
} from "@/actions/order";
import { authMiddleware } from "@/middleware";
import type { OrderRequest } from "@/types/order";

export const Route = createFileRoute("/api/orders")({
	server: {
		middleware: [authMiddleware],
		handlers: {
			POST: async ({ request, context }) => {
				try {
					const userId = context.id;
					const userRole = context.role;

					const body = (await request.json()) as OrderRequest;

					const order = await createOrderService(userId, userRole, body);

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
						{ status: 201 },
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
			GET: async ({ context }) => {
				try {
					const userId = context.id;
					const role = context.role;

					const orders = await getOrdersByCustomerService(userId, role);

					if ("error" in orders) {
						return new Response(JSON.stringify({ error: orders.error }), {
							status: 400,
						});
					}

					return new Response(JSON.stringify(orders), { status: 200 });
				} catch (error) {
					return new Response(
						JSON.stringify({
							error: "Failed to query order by user data",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
						{ status: 500 },
					);
				}
			},
		},
	},
});
