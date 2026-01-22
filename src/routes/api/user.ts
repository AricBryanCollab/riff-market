import { createFileRoute } from "@tanstack/react-router";
import {
	deleteUserService,
	getUserByIdService,
	updateUserService,
} from "@/actions/user";
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

							if ("error" in updatedUser) {
								return new Response(
									JSON.stringify({
										message: "Failed to delete the user data",
									}),
									{ status: 400 },
								);
							}

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

				DELETE: {
					handler: async ({ context, request }) => {
						try {
							const userId = context.id;
							const url = new URL(request.url);
							const email = url.searchParams.get("email");

							if (!email) {
								return new Response(
									JSON.stringify({
										error: "Email query parameter is required",
									}),
									{ status: 400 },
								);
							}

							const result = await deleteUserService(userId, email);

							if ("error" in result) {
								return new Response(JSON.stringify(result), { status: 400 });
							}

							return new Response(JSON.stringify(result), { status: 200 });
						} catch (error) {
							console.error(error);
							return new Response(
								JSON.stringify({
									message: "Failed to delete user",
								}),
								{ status: 500 },
							);
						}
					},
				},
			}),
	},
});
