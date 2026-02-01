import { createFileRoute } from "@tanstack/react-router";
import { createReviewService } from "@/actions/review";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/reviews")({
	server: {
		handlers: ({ createHandlers }) =>
			createHandlers({
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
							console.error(error);
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


