import { createFileRoute } from "@tanstack/react-router";
import { getOrdersBySellerService } from "@/actions/order";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/orders/seller")({
	server: {
		middleware: [requestLoggerMiddleware],
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
							logger.error("Failed to get seller orders", error);
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
