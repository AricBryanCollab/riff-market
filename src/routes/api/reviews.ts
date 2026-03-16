import { createFileRoute } from "@tanstack/react-router";
import { createReviewService, getReviewsByProductService } from "@/actions/review";
import { logger } from "@/lib/logger";
import { authMiddleware, requestLoggerMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/reviews")({
	server: {
		middleware: [requestLoggerMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: {
					handler: async ({ request }) => {
						try {
							const url = new URL(request.url);
							const queryParams = Object.fromEntries(url.searchParams);

							const reviews = await getReviewsByProductService(queryParams);

							if ("error" in reviews) {
								return new Response(JSON.stringify(reviews), {
									status: 400,
								});
							}

							return new Response(JSON.stringify(reviews), { status: 200 });
						} catch (error) {
							logger.error("Failed to get reviews", error);
							return new Response(
								JSON.stringify({
									message: "Failed to get reviews",
								}),
								{ status: 500 },
							);
						}
					},
				},
				POST: {
					middleware: [authMiddleware],
					handler: async ({ request, context }) => {
						try {
							const userId = context.id;
							const authRole = context.role;
							const body = await request.json();

							const newReview = await createReviewService(
								userId,
								authRole,
								body,
							);

							if ("error" in newReview) {
								return new Response(
									JSON.stringify({
										message: newReview.error,
										details: newReview.details,
									}),
									{ status: 400 },
								);
							}

							return new Response(
								JSON.stringify({
									review: newReview,
									message: "Review created successfully",
								}),
								{ status: 201 },
							);
						} catch (error) {
							logger.error("Failed to create review", error);
							return new Response(
								JSON.stringify({
									message:
										error instanceof Error
											? error.message
											: "Failed to create review",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
