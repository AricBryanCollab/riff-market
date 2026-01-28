import { createFileRoute } from "@tanstack/react-router";
import { getOrdersBySellerService } from "@/actions/order";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/orders/seller")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					middleware: [authMiddleware],
					handler: async ({ context }) => {
						try {
							const userId = context.id;
							const role = context.role;

							const orders = await getOrdersBySellerService(userId, role);

							if ("error" in orders) {
								return new Response(
									JSON.stringify({
										message: orders.error,
									}),
									{ status: 400 },
								);
							}

							return new Response(JSON.stringify(orders), { status: 200 });
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to get seller orders",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
