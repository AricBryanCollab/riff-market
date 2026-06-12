import { createFileRoute } from "@tanstack/react-router";
import { getOrderByIdService, updateOrderStatusService } from "@/actions/order";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/orders/$id")({
	server: {
		middleware: [requestLoggerMiddleware, authMiddleware],
		handlers: {
			GET: async ({ params, context }) => {
				try {
					const { id } = params;
					const userId = context.id;
					const role = context.role;

					const order = await getOrderByIdService(userId, role, id);

					if ("error" in order) {
						return new Response(
							JSON.stringify({
								error: order.error,
							}),
							{ status: 400 },
						);
					}

					return new Response(JSON.stringify(order), { status: 200 });
				} catch (error) {
					logger.error("Failed to get order by ID", error);
					return new Response(
						JSON.stringify({
							error: "Failed to get order by ID",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
					);
				}
			},
			PUT: async ({ params, context, request }) => {
				try {
					const { id } = params;
					const body = (await request.json()) as unknown;
					const { status, trackingNumber } = parseStatusUpdateBody(body);
					const userId = context.id;
					const role = context.role;

					const order = await updateOrderStatusService(
						userId,
						role,
						id,
						status,
						trackingNumber,
					);

					if ("error" in order) {
						return new Response(
							JSON.stringify({
								error: order.error,
							}),
							{ status: 400 },
						);
					}

					return new Response(
						JSON.stringify({ message: "Order has been updated", order }),
						{ status: 200 },
					);
				} catch (error) {
					logger.error("Failed to update the order status", error);
					return new Response(
						JSON.stringify({
							error: "Failed to update the order status",
							details: error instanceof Error ? error.message : "Unknown error",
						}),
					);
				}
			},
		},
	},
});

function parseStatusUpdateBody(body: unknown) {
	if (typeof body === "string") {
		return {
			status: body,
			trackingNumber: undefined,
		};
	}

	if (body && typeof body === "object") {
		const status =
			"status" in body && typeof body.status === "string"
				? body.status
				: undefined;
		const trackingNumber =
			"trackingNumber" in body && typeof body.trackingNumber === "string"
				? body.trackingNumber
				: undefined;

		return {
			status,
			trackingNumber,
		};
	}

	return {
		status: undefined,
		trackingNumber: undefined,
	};
}
