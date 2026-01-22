import { createFileRoute } from "@tanstack/react-router";
import { getUserByIdService, updateUserService } from "@/actions/user";
import { authMiddleware } from "@/middleware";

export const Route = createFileRoute("/api/user")({
	server: {
		middleware: [authMiddleware],
		handlers: ({ createHandlers }) =>
			createHandlers({
				GET: async ({ context }) => {
					try {
						const userId = context.id;

						const user = await getUserByIdService(userId);

						return new Response(JSON.stringify(user));
					} catch (error) {
						console.error(error);
						return new Response(
							JSON.stringify({ message: "Failed to query user data" }),
							{ status: 500 },
						);
					}
				},

				PUT: {
					handler: async ({ request, context }) => {
						try {
							const userId = context.id;
							const rawData = await request.json();

							const updatedUser = await updateUserService(userId, rawData);

							return new Response(JSON.stringify(updatedUser), { status: 200 });
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to update the user data",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
